import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  handleCors,
  validateApiKey,
  jsonResponse,
  errorResponse,
  unauthorizedResponse,
  getJsonBody,
} from '@/lib/api-utils'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || jsonResponse({}, 200, request)
}

async function getUserName(userId: string | number): Promise<string> {
  if (!userId) return 'Unknown'
  const { data } = await supabaseAdmin
    .from('Users')
    .select('name')
    .eq('id', Number(userId))
    .maybeSingle()
  return data?.name || 'Unknown'
}

export async function GET(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    if (action === 'get_solutions') {
      const questionId = Number(searchParams.get('question_id'))
      const userId = searchParams.get('user_id')

      if (!questionId || questionId <= 0) {
        return errorResponse('Invalid question ID', 400, request)
      }

      const { data: solutions } = await supabaseAdmin
        .from('CommunitySolutions')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: false })

      if (!solutions) {
        return jsonResponse({ status: 'success', data: [] }, 200, request)
      }

      const enrichedSolutions = await Promise.all(
        solutions.map(async (solution) => {
          const userName = await getUserName(solution.user_id)

          // Get like count
          const { count: likeCount } = await supabaseAdmin
            .from('solutionlikes')
            .select('*', { count: 'exact', head: true })
            .eq('solution_id', solution.id)

          // Get comment count
          const { count: commentCount } = await supabaseAdmin
            .from('solutioncomments')
            .select('*', { count: 'exact', head: true })
            .eq('solution_id', solution.id)

          // Check if user liked
          let isLiked = false
          if (userId) {
            const { data: like } = await supabaseAdmin
              .from('solutionlikes')
              .select('id')
              .eq('user_id', userId)
              .eq('solution_id', solution.id)
              .maybeSingle()
            isLiked = !!like
          }

          return {
            ...solution,
            user_name: userName,
            like_count: likeCount || 0,
            comment_count: commentCount || 0,
            is_liked: isLiked,
          }
        })
      )

      // Sort by like_count desc, then created_at desc
      enrichedSolutions.sort((a, b) => {
        if (b.like_count !== a.like_count) return b.like_count - a.like_count
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      return jsonResponse({ status: 'success', data: enrichedSolutions }, 200, request)
    }

    if (action === 'get_comments') {
      const solutionId = Number(searchParams.get('solution_id'))
      const userId = searchParams.get('user_id')

      if (!solutionId || solutionId <= 0) {
        return errorResponse('Invalid solution ID', 400, request)
      }

      const { data: comments } = await supabaseAdmin
        .from('SolutionComments')
        .select('*')
        .eq('solution_id', solutionId)
        .order('created_at', { ascending: true })

      if (!comments) {
        return jsonResponse({ status: 'success', data: [] }, 200, request)
      }

      const enrichedComments = await Promise.all(
        comments.map(async (comment) => {
          const userName = await getUserName(comment.user_id)

          // Get like count
          const { count: likeCount } = await supabaseAdmin
            .from('commentlikes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', comment.id)

          // Check if user liked
          let isLiked = false
          if (userId) {
            const { data: like } = await supabaseAdmin
              .from('commentlikes')
              .select('id')
              .eq('user_id', userId)
              .eq('comment_id', comment.id)
              .maybeSingle()
            isLiked = !!like
          }

          return {
            ...comment,
            user_name: userName,
            like_count: likeCount || 0,
            is_liked: isLiked,
          }
        })
      )

      // Sort by like_count desc, then created_at asc
      enrichedComments.sort((a, b) => {
        if (b.like_count !== a.like_count) return b.like_count - a.like_count
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

      return jsonResponse({ status: 'success', data: enrichedComments }, 200, request)
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Community solutions GET error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (!validateApiKey(request)) {
    return unauthorizedResponse(request)
  }

  const input = await getJsonBody<Record<string, unknown>>(request)
  if (!input) {
    return errorResponse('Invalid request body', 400, request)
  }

  const action = (input.action as string) || new URL(request.url).searchParams.get('action')

  try {
    if (action === 'add_solution') {
      const userId = input.user_id
      const questionId = Number(input.question_id)
      const solutionCode = (input.solution_code as string)?.trim()
      const language = (input.language as string)?.trim()
      const explanation = (input.explanation as string)?.trim()

      if (!userId || !questionId || !solutionCode || !language) {
        return errorResponse('Missing required fields', 400, request)
      }

      const { data: result, error } = await supabaseAdmin
        .from('CommunitySolutions')
        .insert({
          user_id: userId,
          question_id: questionId,
          solution_code: solutionCode,
          language,
          explanation: explanation || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return jsonResponse(
        {
          status: 'success',
          message: 'Solution posted successfully',
          data: { id: result.id, created_at: result.created_at },
        },
        200,
        request
      )
    }

    if (action === 'add_comment') {
      const userId = input.user_id
      const solutionId = Number(input.solution_id)
      const comment = (input.comment as string)?.trim()

      if (!userId || !solutionId || !comment) {
        return errorResponse('Missing required fields', 400, request)
      }

      const { data: result, error } = await supabaseAdmin
        .from('SolutionComments')
        .insert({
          user_id: userId,
          solution_id: solutionId,
          comment,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return jsonResponse(
        {
          status: 'success',
          message: 'Comment posted successfully',
          data: { id: result.id, created_at: result.created_at },
        },
        200,
        request
      )
    }

    if (action === 'toggle_solution_like') {
      const userId = input.user_id
      const solutionId = Number(input.solution_id)

      if (!userId || !solutionId) {
        return errorResponse('Missing required fields', 400, request)
      }

      const { data: existing } = await supabaseAdmin
        .from('solutionlikes')
        .select('id')
        .eq('user_id', userId)
        .eq('solution_id', solutionId)
        .maybeSingle()

      let liked = false
      if (existing) {
        await supabaseAdmin.from('solutionlikes').delete().eq('id', existing.id)
      } else {
        await supabaseAdmin.from('solutionlikes').insert({
          user_id: userId,
          solution_id: solutionId,
          created_at: new Date().toISOString(),
        })
        liked = true
      }

      const { count: newCount } = await supabaseAdmin
        .from('solutionlikes')
        .select('*', { count: 'exact', head: true })
        .eq('solution_id', solutionId)

      return jsonResponse({ status: 'success', liked, new_count: newCount || 0 }, 200, request)
    }

    if (action === 'toggle_comment_like') {
      const userId = input.user_id
      const commentId = Number(input.comment_id)

      if (!userId || !commentId) {
        return errorResponse('Missing required fields', 400, request)
      }

      const { data: existing } = await supabaseAdmin
        .from('commentlikes')
        .select('id')
        .eq('user_id', userId)
        .eq('comment_id', commentId)
        .maybeSingle()

      let liked = false
      if (existing) {
        await supabaseAdmin.from('commentlikes').delete().eq('id', existing.id)
      } else {
        await supabaseAdmin.from('commentlikes').insert({
          user_id: userId,
          comment_id: commentId,
          created_at: new Date().toISOString(),
        })
        liked = true
      }

      const { count: newCount } = await supabaseAdmin
        .from('commentlikes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId)

      return jsonResponse({ status: 'success', liked, new_count: newCount || 0 }, 200, request)
    }

    return errorResponse('Invalid action', 400, request)
  } catch (error) {
    console.error('Community solutions POST error:', error)
    return errorResponse('An error occurred', 500, request)
  }
}
