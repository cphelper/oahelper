<?php

/**
 * Lightweight Supabase REST client helpers for server-side PHP scripts.
 * Provides common utilities plus domain helpers for user_daily_requests
 * and user_question_access tables.
 */

if (!function_exists('getSupabaseConfig')) {
    function getSupabaseConfig(): ?array {
        static $config = null;

        if ($config !== null) {
            return $config;
        }

        $url = 'https://spjkugnxvomrsaapfbgx.supabase.co';
        $key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwamt1Z254dm9tcnNhYXBmYmd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk5NDU5OCwiZXhwIjoyMDc5NTcwNTk4fQ.UV9gri0-kMASO_091J3womAJIp75r1zvWBWA49Hy6OE';

        if (empty($url) || empty($key)) {
            error_log('Supabase configuration is missing.');
            return null;
        }

        $config = [
            'url' => rtrim($url, '/'),
            'service_key' => $key,
        ];

        return $config;
    }
}

if (!function_exists('supabaseRequest')) {
    function supabaseRequest(string $method, string $path, array $queryParams = [], $body = null, array $extraHeaders = []): array {
        $config = getSupabaseConfig();
        if (!$config) {
            return ['success' => false, 'status' => 500, 'error' => 'Supabase config missing'];
        }

        $url = $config['url'] . $path;
        if (!empty($queryParams)) {
            $queryString = http_build_query($queryParams, '', '&', PHP_QUERY_RFC3986);
            $url .= '?' . $queryString;
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        $headers = [
            'apikey: ' . $config['service_key'],
            'Authorization: Bearer ' . $config['service_key'],
            'Content-Type: application/json',
        ];

        if (!empty($extraHeaders)) {
            $headers = array_merge($headers, $extraHeaders);
        }

        if ($body !== null) {
            $payload = is_string($body) ? $body : json_encode($body);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_HEADER, true);

        $response = curl_exec($ch);

        if ($response === false) {
            $error = curl_error($ch);
            curl_close($ch);
            error_log('Supabase request error: ' . $error);
            return ['success' => false, 'status' => 500, 'error' => $error];
        }

        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $headerStr = substr($response, 0, $headerSize);
        $bodyStr = substr($response, $headerSize);
        
        // Parse headers
        $responseHeaders = [];
        foreach (explode("\r\n", $headerStr) as $i => $line) {
            if ($i === 0) continue;
            if (empty(trim($line))) continue;
            
            $parts = explode(':', $line, 2);
            if (count($parts) === 2) {
                $responseHeaders[strtolower(trim($parts[0]))] = trim($parts[1]);
            }
        }

        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = null;
        if ($bodyStr !== '' && $bodyStr !== null) {
            $decoded = json_decode($bodyStr, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $decoded = $bodyStr;
            }
        }

        if ($status >= 200 && $status < 300) {
            return ['success' => true, 'status' => $status, 'data' => $decoded, 'headers' => $responseHeaders];
        }

        return ['success' => false, 'status' => $status, 'error' => $decoded ?? $bodyStr, 'headers' => $responseHeaders];
    }
}

if (!function_exists('supabaseCount')) {
    function supabaseCount(string $table, array $filters = []): int {
        $headers = ['Prefer: count=exact', 'Range: 0-0'];
        $response = supabaseRequest('GET', '/rest/v1/' . $table, $filters, null, $headers);
        
        if ($response['success'] && isset($response['headers']['content-range'])) {
            $parts = explode('/', $response['headers']['content-range']);
            if (count($parts) > 1) {
                return (int)$parts[1];
            }
        }
        return 0;
    }
}

if (!function_exists('supabaseSelect')) {
    function supabaseSelect(string $table, array $filters = [], string $columns = '*', bool $single = false) {
        $query = array_merge(['select' => $columns], $filters);
        $headers = [];
        if ($single) {
            $headers[] = 'Accept: application/vnd.pgrst.object+json';
        }

        $response = supabaseRequest('GET', '/rest/v1/' . $table, $query, null, $headers);

        if ($response['success']) {
            return $response['data'];
        }

        if ($single && in_array($response['status'], [404, 406], true)) {
            return null;
        }

        error_log('Supabase select failed for ' . $table . ': ' . json_encode($response));
        return false;
    }
}

if (!function_exists('supabaseInsert')) {
    function supabaseInsert(string $table, array $payload): bool {
        $response = supabaseRequest('POST', '/rest/v1/' . $table, [], $payload, ['Prefer: return=representation']);
        if (!$response['success']) {
            error_log('Supabase insert failed for ' . $table . ': ' . json_encode($response));
        }
        return $response['success'];
    }
}

if (!function_exists('supabaseUpsert')) {
    function supabaseUpsert(string $table, array $payload): bool {
        $headers = [
            'Prefer: resolution=merge-duplicates',
            'Prefer: return=representation'
        ];
        $response = supabaseRequest('POST', '/rest/v1/' . $table, [], $payload, $headers);
        return $response['success'];
    }
}

if (!function_exists('supabasePatch')) {
    function supabasePatch(string $table, array $filters, array $payload): bool {
        $response = supabaseRequest('PATCH', '/rest/v1/' . $table, $filters, $payload, ['Prefer: return=representation']);
        return $response['success'];
    }
}

if (!function_exists('supabaseDelete')) {
    function supabaseDelete(string $table, array $filters): bool {
        $response = supabaseRequest('DELETE', '/rest/v1/' . $table, $filters);
        return $response['success'];
    }
}

if (!function_exists('supabaseRpc')) {
    function supabaseRpc(string $function, array $params = []) {
        $response = supabaseRequest('POST', '/rest/v1/rpc/' . $function, [], $params);
        if ($response['success']) {
            return $response['data'];
        }
        return null;
    }
}

if (!function_exists('supabaseSignIn')) {
    function supabaseSignIn(string $email, string $password): array {
        $response = supabaseRequest('POST', '/auth/v1/token?grant_type=password', [], [
            'email' => $email,
            'password' => $password
        ]);
        
        return $response;
    }
}

if (!function_exists('supabaseSignUp')) {
    function supabaseSignUp(string $email, string $password, array $data = []): array {
        // Use auto_confirm if you want to bypass Supabase email verification
        // But here we rely on custom verification code in profiles, so we might want to let Supabase create the user.
        // We'll pass user metadata.
        
        $payload = [
            'email' => $email,
            'password' => $password,
            'data' => $data
        ];
        
        $response = supabaseRequest('POST', '/auth/v1/signup', [], $payload);
        return $response;
    }
}

if (!function_exists('supabaseAdminDeleteUser')) {
    function supabaseAdminDeleteUser(string $userId): bool {
        // Requires service_role key
        $response = supabaseRequest('DELETE', '/auth/v1/admin/users/' . $userId);
        return $response['success'];
    }
}

if (!function_exists('supabaseAdminUpdateUserPassword')) {
    function supabaseAdminUpdateUserPassword(string $userId, string $newPassword): bool {
        // Requires service_role key
        $payload = [
            'password' => $newPassword
        ];
        $response = supabaseRequest('PUT', '/auth/v1/admin/users/' . $userId, [], $payload);
        return $response['success'];
    }
}


if (!function_exists('supabaseGetDailyRequestCount')) {
    function supabaseGetDailyRequestCount($userId, ?string $date = null): ?int {
        // user_id can be UUID string or legacy int, table uses TEXT type
        $date = $date ?? date('Y-m-d');
        $filters = [
            'user_id' => 'eq.' . $userId,
            'request_date' => 'eq.' . $date,
        ];
        $record = supabaseSelect('user_daily_requests', $filters, 'id,request_count', true);
        if ($record === false) {
            return null;
        }
        if ($record === null) {
            return 0;
        }

        return (int)($record['request_count'] ?? 0);
    }
}

if (!function_exists('supabaseIncrementDailyRequestCount')) {
    function supabaseIncrementDailyRequestCount($userId, ?string $date = null): ?int {
        // user_id can be UUID string or legacy int, table uses TEXT type
        $date = $date ?? date('Y-m-d');
        $filters = [
            'user_id' => 'eq.' . $userId,
            'request_date' => 'eq.' . $date,
        ];

        $currentRecord = supabaseSelect('user_daily_requests', $filters, 'id,request_count', true);

        if ($currentRecord === false) {
            return null;
        }

        if (is_array($currentRecord) && isset($currentRecord['request_count'])) {
            $newCount = ((int)$currentRecord['request_count']) + 1;
            $payload = [
                'request_count' => $newCount,
                'updated_at' => gmdate('c'),
            ];

            $updated = supabasePatch('user_daily_requests', $filters, $payload);
            return $updated ? $newCount : null;
        }

        $payload = [
            'user_id' => (string)$userId,
            'request_date' => $date,
            'request_count' => 1,
        ];

        $inserted = supabaseInsert('user_daily_requests', $payload);
        return $inserted ? 1 : null;
    }
}

if (!function_exists('supabaseGetUserQuestionAccess')) {
    function supabaseGetUserQuestionAccess($userId, int $companyId, int $default = 1): ?int {
        // user_id can be UUID string or legacy int, table uses TEXT type
        $filters = [
            'user_id' => 'eq.' . $userId,
            'company_id' => 'eq.' . $companyId,
        ];
        $record = supabaseSelect('user_question_access', $filters, 'id,questions_accessed', true);
        if ($record === false) {
            return null;
        }
        if ($record === null) {
            return $default;
        }
        if (is_array($record) && array_key_exists('questions_accessed', $record)) {
            return (int)$record['questions_accessed'];
        }

        return $default;
    }
}

if (!function_exists('supabaseUpdateUserQuestionAccess')) {
    function supabaseUpdateUserQuestionAccess($userId, int $companyId, int $questionsAccessed): bool {
        // user_id can be UUID string or legacy int, table uses TEXT type
        $payload = [
            'user_id' => (string)$userId,
            'company_id' => $companyId,
            'questions_accessed' => $questionsAccessed,
            'updated_at' => gmdate('c'),
        ];

        return supabaseUpsert('user_question_access', $payload);
    }
}

if (!function_exists('supabaseGetProfile')) {
    // DEPRECATED: Use supabaseGetUserById or supabaseGetUserByEmail instead
    function supabaseGetProfile($id): ?array {
        if (is_numeric($id)) {
            return supabaseSelect('Users', ['id' => 'eq.' . $id], '*', true);
        }
        // Try by email if not numeric
        return supabaseSelect('Users', ['email' => 'eq.' . $id], '*', true);
    }
}

if (!function_exists('supabaseGetProfileByLegacyId')) {
    // DEPRECATED: Use supabaseGetUserById instead
    function supabaseGetProfileByLegacyId(int $legacyId): ?array {
        return supabaseSelect('Users', ['id' => 'eq.' . $legacyId], '*', true);
    }
}

if (!function_exists('supabaseGetProfileByEmail')) {
    // DEPRECATED: Use supabaseGetUserByEmail instead
    function supabaseGetProfileByEmail(string $email): ?array {
        return supabaseSelect('Users', ['email' => 'eq.' . $email], '*', true);
    }
}

if (!function_exists('supabaseUpdateProfile')) {
    // DEPRECATED: Use supabaseUpdateUser instead
    function supabaseUpdateProfile($id, array $data): bool {
        $data['updated_at'] = gmdate('c');
        return supabasePatch('Users', ['id' => 'eq.' . $id], $data);
    }
}

if (!function_exists('supabaseGetUserById')) {
    function supabaseGetUserById(int $id): ?array {
        return supabaseSelect('Users', ['id' => 'eq.' . $id], '*', true);
    }
}

if (!function_exists('supabaseUpdateUser')) {
    function supabaseUpdateUser(int $id, array $data): bool {
        $data['updated_at'] = gmdate('c');
        return supabasePatch('Users', ['id' => 'eq.' . $id], $data);
    }
}

if (!function_exists('supabaseGetUserByEmail')) {
    function supabaseGetUserByEmail(string $email): ?array {
        return supabaseSelect('Users', ['email' => 'eq.' . $email], '*', true);
    }
}

if (!function_exists('supabaseCreateUser')) {
    function supabaseCreateUser(array $userData): ?array {
        $userData['created_at'] = gmdate('c');
        $userData['updated_at'] = gmdate('c');
        // ID is now auto-generated via sequence, no need to set manually
        
        $response = supabaseRequest('POST', '/rest/v1/Users', [], $userData, ['Prefer: return=representation']);
        if ($response['success'] && !empty($response['data'])) {
            return is_array($response['data']) ? ($response['data'][0] ?? $response['data']) : null;
        }
        return null;
    }
}

// ============================================
// COMPANIES HELPERS
// ============================================

if (!function_exists('supabaseGetCompanies')) {
    function supabaseGetCompanies(int $limit = 20, int $offset = 0): array {
        $filters = [
            'order' => 'date.desc,name.asc',
            'limit' => $limit,
            'offset' => $offset
        ];
        $result = supabaseSelect('Companies', $filters);
        return $result ?: [];
    }
}

if (!function_exists('supabaseGetCompanyById')) {
    function supabaseGetCompanyById(int $id): ?array {
        return supabaseSelect('Companies', ['id' => 'eq.' . $id], '*', true);
    }
}

if (!function_exists('supabaseGetCompanyByName')) {
    function supabaseGetCompanyByName(string $name): ?array {
        return supabaseSelect('Companies', ['name' => 'eq.' . $name], '*', true);
    }
}

if (!function_exists('supabaseSearchCompanies')) {
    function supabaseSearchCompanies(string $search, int $limit = 50): array {
        $filters = [
            'name' => 'ilike.*' . $search . '*',
            'order' => 'date.desc,name.asc',
            'limit' => $limit
        ];
        $result = supabaseSelect('Companies', $filters);
        return $result ?: [];
    }
}

if (!function_exists('supabaseInsertCompany')) {
    function supabaseInsertCompany(string $name, ?string $date = null, bool $solutionsAvailable = false): ?array {
        $payload = [
            'name' => $name,
            'date' => $date ?? date('Y-m-d'),
            'solutions_available' => $solutionsAvailable,
            'created_at' => gmdate('c'),
            'updated_at' => gmdate('c')
        ];
        $response = supabaseRequest('POST', '/rest/v1/Companies', [], $payload, ['Prefer: return=representation']);
        if ($response['success'] && !empty($response['data'])) {
            return is_array($response['data']) ? ($response['data'][0] ?? $response['data']) : null;
        }
        return null;
    }
}

if (!function_exists('supabaseUpdateCompany')) {
    function supabaseUpdateCompany(int $id, array $data): bool {
        $data['updated_at'] = gmdate('c');
        return supabasePatch('Companies', ['id' => 'eq.' . $id], $data);
    }
}

if (!function_exists('supabaseDeleteCompany')) {
    function supabaseDeleteCompany(int $id): bool {
        return supabaseDelete('Companies', ['id' => 'eq.' . $id]);
    }
}

if (!function_exists('supabaseCountCompanies')) {
    function supabaseCountCompanies(): int {
        return supabaseCount('Companies');
    }
}

// ============================================
// QUESTIONS HELPERS
// ============================================

if (!function_exists('supabaseGetQuestions')) {
    function supabaseGetQuestions(int $limit = 20, int $offset = 0, ?int $companyId = null): array {
        $filters = [
            'order' => 'created_at.desc',
            'limit' => $limit,
            'offset' => $offset
        ];
        if ($companyId !== null) {
            $filters['company_id'] = 'eq.' . $companyId;
        }
        $result = supabaseSelect('Questions', $filters);
        return $result ?: [];
    }
}

if (!function_exists('supabaseGetQuestionById')) {
    function supabaseGetQuestionById(int $id): ?array {
        return supabaseSelect('Questions', ['id' => 'eq.' . $id], '*', true);
    }
}

if (!function_exists('supabaseGetQuestionsByCompanyId')) {
    function supabaseGetQuestionsByCompanyId(int $companyId): array {
        $result = supabaseSelect('Questions', ['company_id' => 'eq.' . $companyId, 'order' => 'created_at.desc']);
        return $result ?: [];
    }
}

if (!function_exists('supabaseInsertQuestion')) {
    function supabaseInsertQuestion(array $data): ?array {
        $data['created_at'] = $data['created_at'] ?? gmdate('c');
        $data['updated_at'] = gmdate('c');
        $response = supabaseRequest('POST', '/rest/v1/Questions', [], $data, ['Prefer: return=representation']);
        if ($response['success'] && !empty($response['data'])) {
            return is_array($response['data']) ? ($response['data'][0] ?? $response['data']) : null;
        }
        return null;
    }
}

if (!function_exists('supabaseUpdateQuestion')) {
    function supabaseUpdateQuestion(int $id, array $data): bool {
        $data['updated_at'] = gmdate('c');
        return supabasePatch('Questions', ['id' => 'eq.' . $id], $data);
    }
}

if (!function_exists('supabaseDeleteQuestion')) {
    function supabaseDeleteQuestion(int $id): bool {
        return supabaseDelete('Questions', ['id' => 'eq.' . $id]);
    }
}

if (!function_exists('supabaseCountQuestions')) {
    function supabaseCountQuestions(?int $companyId = null): int {
        $filters = $companyId !== null ? ['company_id' => 'eq.' . $companyId] : [];
        return supabaseCount('Questions', $filters);
    }
}

if (!function_exists('supabaseSearchQuestions')) {
    function supabaseSearchQuestions(string $search, int $limit = 50): array {
        $filters = [
            'or' => '(title.ilike.*' . $search . '*,problem_statement.ilike.*' . $search . '*)',
            'order' => 'created_at.desc',
            'limit' => $limit
        ];
        $result = supabaseSelect('Questions', $filters);
        return $result ?: [];
    }
}

// ============================================
// QUESTION IMAGES HELPERS
// ============================================

if (!function_exists('supabaseGetQuestionImages')) {
    function supabaseGetQuestionImages(int $questionId): array {
        $result = supabaseSelect('questionimages', ['question_id' => 'eq.' . $questionId, 'order' => 'uploaded_at.asc']);
        return $result ?: [];
    }
}

if (!function_exists('supabaseInsertQuestionImage')) {
    function supabaseInsertQuestionImage(int $questionId, string $imagePath, ?string $imageUrl = null): bool {
        $payload = [
            'question_id' => $questionId,
            'image_path' => $imagePath,
            'image_url' => $imageUrl,
            'uploaded_at' => gmdate('c')
        ];
        return supabaseInsert('questionimages', $payload);
    }
}

if (!function_exists('supabaseDeleteQuestionImages')) {
    function supabaseDeleteQuestionImages(int $questionId): bool {
        return supabaseDelete('questionimages', ['question_id' => 'eq.' . $questionId]);
    }
}

// ============================================
// INTERVIEW EXPERIENCES HELPERS
// ============================================

if (!function_exists('supabaseGetInterviewExperiences')) {
    function supabaseGetInterviewExperiences(int $limit = 10, int $offset = 0, ?string $status = 'approved', ?string $search = null): array {
        $filters = [
            'order' => 'created_at.desc',
            'limit' => $limit,
            'offset' => $offset
        ];
        if ($status !== null) {
            $filters['status'] = 'eq.' . $status;
        }
        if ($search !== null && $search !== '') {
            $filters['or'] = '(company.ilike.*' . $search . '*,role.ilike.*' . $search . '*,college.ilike.*' . $search . '*,experience.ilike.*' . $search . '*)';
        }
        $result = supabaseSelect('InterviewExperiences', $filters);
        return $result ?: [];
    }
}

if (!function_exists('supabaseCountInterviewExperiences')) {
    function supabaseCountInterviewExperiences(?string $status = 'approved', ?string $search = null): int {
        $filters = [];
        if ($status !== null) {
            $filters['status'] = 'eq.' . $status;
        }
        if ($search !== null && $search !== '') {
            $filters['or'] = '(company.ilike.*' . $search . '*,role.ilike.*' . $search . '*,college.ilike.*' . $search . '*,experience.ilike.*' . $search . '*)';
        }
        return supabaseCount('InterviewExperiences', $filters);
    }
}

if (!function_exists('supabaseGetInterviewExperienceById')) {
    function supabaseGetInterviewExperienceById(int $id): ?array {
        return supabaseSelect('InterviewExperiences', ['id' => 'eq.' . $id], '*', true);
    }
}

if (!function_exists('supabaseInsertInterviewExperience')) {
    function supabaseInsertInterviewExperience(array $data): ?array {
        $data['created_at'] = $data['created_at'] ?? gmdate('c');
        $data['updated_at'] = gmdate('c');
        $data['status'] = $data['status'] ?? 'pending';
        $response = supabaseRequest('POST', '/rest/v1/InterviewExperiences', [], $data, ['Prefer: return=representation']);
        if ($response['success'] && !empty($response['data'])) {
            return is_array($response['data']) ? ($response['data'][0] ?? $response['data']) : null;
        }
        return null;
    }
}

if (!function_exists('supabaseUpdateInterviewExperience')) {
    function supabaseUpdateInterviewExperience(int $id, array $data): bool {
        $data['updated_at'] = gmdate('c');
        return supabasePatch('InterviewExperiences', ['id' => 'eq.' . $id], $data);
    }
}

if (!function_exists('supabaseDeleteInterviewExperience')) {
    function supabaseDeleteInterviewExperience(int $id): bool {
        return supabaseDelete('InterviewExperiences', ['id' => 'eq.' . $id]);
    }
}

// ============================================
// COMMUNITY SOLUTIONS HELPERS
// ============================================

if (!function_exists('supabaseGetCommunitySolutions')) {
    function supabaseGetCommunitySolutions(?int $questionId = null, int $limit = 20, int $offset = 0): array {
        $filters = [
            'order' => 'created_at.desc',
            'limit' => $limit,
            'offset' => $offset
        ];
        if ($questionId !== null) {
            $filters['question_id'] = 'eq.' . $questionId;
        }
        $result = supabaseSelect('CommunitySolutions', $filters);
        return $result ?: [];
    }
}

if (!function_exists('supabaseGetCommunitySolutionById')) {
    function supabaseGetCommunitySolutionById(int $id): ?array {
        return supabaseSelect('CommunitySolutions', ['id' => 'eq.' . $id], '*', true);
    }
}

if (!function_exists('supabaseInsertCommunitySolution')) {
    function supabaseInsertCommunitySolution($userId, int $questionId, string $solutionCode, string $language, ?string $explanation = null): ?array {
        $payload = [
            'user_id' => $userId,
            'question_id' => $questionId,
            'solution_code' => $solutionCode,
            'language' => $language,
            'explanation' => $explanation,
            'created_at' => gmdate('c')
        ];
        $response = supabaseRequest('POST', '/rest/v1/CommunitySolutions', [], $payload, ['Prefer: return=representation']);
        if ($response['success'] && !empty($response['data'])) {
            return is_array($response['data']) ? ($response['data'][0] ?? $response['data']) : null;
        }
        return null;
    }
}

if (!function_exists('supabaseCountCommunitySolutions')) {
    function supabaseCountCommunitySolutions(?int $questionId = null): int {
        $filters = $questionId !== null ? ['question_id' => 'eq.' . $questionId] : [];
        return supabaseCount('CommunitySolutions', $filters);
    }
}

// ============================================
// SOLUTION COMMENTS HELPERS
// ============================================

if (!function_exists('supabaseGetSolutionComments')) {
    function supabaseGetSolutionComments(int $solutionId): array {
        $result = supabaseSelect('SolutionComments', ['solution_id' => 'eq.' . $solutionId, 'order' => 'created_at.asc']);
        return $result ?: [];
    }
}

if (!function_exists('supabaseInsertSolutionComment')) {
    function supabaseInsertSolutionComment(int $solutionId, $userId, string $comment): ?array {
        $payload = [
            'solution_id' => $solutionId,
            'user_id' => $userId,
            'comment' => $comment,
            'created_at' => gmdate('c')
        ];
        $response = supabaseRequest('POST', '/rest/v1/SolutionComments', [], $payload, ['Prefer: return=representation']);
        if ($response['success'] && !empty($response['data'])) {
            return is_array($response['data']) ? ($response['data'][0] ?? $response['data']) : null;
        }
        return null;
    }
}

// ============================================
// SOLUTION LIKES HELPERS
// ============================================

if (!function_exists('supabaseGetSolutionLike')) {
    function supabaseGetSolutionLike($userId, int $solutionId): ?array {
        return supabaseSelect('solutionlikes', ['user_id' => 'eq.' . $userId, 'solution_id' => 'eq.' . $solutionId], '*', true);
    }
}

if (!function_exists('supabaseInsertSolutionLike')) {
    function supabaseInsertSolutionLike($userId, int $solutionId): bool {
        $payload = [
            'user_id' => $userId,
            'solution_id' => $solutionId,
            'created_at' => gmdate('c')
        ];
        return supabaseInsert('solutionlikes', $payload);
    }
}

if (!function_exists('supabaseDeleteSolutionLike')) {
    function supabaseDeleteSolutionLike($userId, int $solutionId): bool {
        return supabaseDelete('solutionlikes', ['user_id' => 'eq.' . $userId, 'solution_id' => 'eq.' . $solutionId]);
    }
}

if (!function_exists('supabaseCountSolutionLikes')) {
    function supabaseCountSolutionLikes(int $solutionId): int {
        // Use direct select with count to ensure accurate results
        $result = supabaseSelect('solutionlikes', ['solution_id' => 'eq.' . $solutionId, 'select' => 'id']);
        if (is_array($result)) {
            return count($result);
        }
        return 0;
    }
}

// ============================================
// COMMENT LIKES HELPERS
// ============================================

if (!function_exists('supabaseGetCommentLike')) {
    function supabaseGetCommentLike($userId, int $commentId): ?array {
        return supabaseSelect('commentlikes', ['user_id' => 'eq.' . $userId, 'comment_id' => 'eq.' . $commentId], '*', true);
    }
}

if (!function_exists('supabaseInsertCommentLike')) {
    function supabaseInsertCommentLike($userId, int $commentId): bool {
        $payload = [
            'user_id' => $userId,
            'comment_id' => $commentId,
            'created_at' => gmdate('c')
        ];
        return supabaseInsert('commentlikes', $payload);
    }
}

if (!function_exists('supabaseDeleteCommentLike')) {
    function supabaseDeleteCommentLike($userId, int $commentId): bool {
        return supabaseDelete('commentlikes', ['user_id' => 'eq.' . $userId, 'comment_id' => 'eq.' . $commentId]);
    }
}

if (!function_exists('supabaseCountCommentLikes')) {
    function supabaseCountCommentLikes(int $commentId): int {
        // Use direct select with count to ensure accurate results
        $result = supabaseSelect('commentlikes', ['comment_id' => 'eq.' . $commentId, 'select' => 'id']);
        if (is_array($result)) {
            return count($result);
        }
        return 0;
    }
}

// ============================================
// CHAT HISTORY HELPERS
// ============================================

if (!function_exists('supabaseGetChatHistory')) {
    function supabaseGetChatHistory(?int $userId = null, ?string $sessionId = null, int $limit = 50): array {
        $filters = ['order' => 'created_at.desc', 'limit' => $limit];
        if ($userId !== null) {
            $filters['user_id'] = 'eq.' . $userId;
        }
        if ($sessionId !== null) {
            $filters['session_id'] = 'eq.' . $sessionId;
        }
        $result = supabaseSelect('ChatHistory', $filters);
        return $result ?: [];
    }
}

if (!function_exists('supabaseInsertChatHistory')) {
    function supabaseInsertChatHistory(array $data): bool {
        $data['created_at'] = $data['created_at'] ?? gmdate('c');
        return supabaseInsert('ChatHistory', $data);
    }
}

if (!function_exists('supabaseCountChatHistory')) {
    function supabaseCountChatHistory(): int {
        return supabaseCount('ChatHistory');
    }
}

// ============================================
// PLACEMENT DATA HELPERS
// ============================================

if (!function_exists('supabaseGetPlacementData')) {
    function supabaseGetPlacementData(int $limit = 50, int $offset = 0, ?string $search = null): array {
        $filters = [
            'order' => 'created_at.desc',
            'limit' => $limit,
            'offset' => $offset
        ];
        if ($search !== null && $search !== '') {
            $filters['or'] = '(company.ilike.*' . $search . '*,role.ilike.*' . $search . '*,college.ilike.*' . $search . '*)';
        }
        $result = supabaseSelect('PlacementData', $filters);
        return $result ?: [];
    }
}

if (!function_exists('supabaseInsertPlacementData')) {
    function supabaseInsertPlacementData(array $data): ?array {
        $data['created_at'] = $data['created_at'] ?? gmdate('c');
        $response = supabaseRequest('POST', '/rest/v1/PlacementData', [], $data, ['Prefer: return=representation']);
        if ($response['success'] && !empty($response['data'])) {
            return is_array($response['data']) ? ($response['data'][0] ?? $response['data']) : null;
        }
        return null;
    }
}

if (!function_exists('supabaseCountPlacementData')) {
    function supabaseCountPlacementData(): int {
        return supabaseCount('PlacementData');
    }
}

// ============================================
// USER QUESTION SUBMISSIONS HELPERS
// ============================================

if (!function_exists('supabaseGetUserQuestionSubmissions')) {
    function supabaseGetUserQuestionSubmissions(?string $status = null, int $limit = 50, int $offset = 0): array {
        $filters = [
            'order' => 'submitted_at.desc',
            'limit' => $limit,
            'offset' => $offset
        ];
        if ($status !== null) {
            $filters['status'] = 'eq.' . $status;
        }
        $result = supabaseSelect('UserQuestionSubmissions', $filters);
        return $result ?: [];
    }
}

if (!function_exists('supabaseGetUserQuestionSubmissionById')) {
    function supabaseGetUserQuestionSubmissionById(int $id): ?array {
        return supabaseSelect('UserQuestionSubmissions', ['id' => 'eq.' . $id], '*', true);
    }
}

if (!function_exists('supabaseInsertUserQuestionSubmission')) {
    function supabaseInsertUserQuestionSubmission(array $data): ?array {
        $data['submitted_at'] = $data['submitted_at'] ?? gmdate('c');
        $data['status'] = $data['status'] ?? 'pending';
        $response = supabaseRequest('POST', '/rest/v1/UserQuestionSubmissions', [], $data, ['Prefer: return=representation']);
        if ($response['success'] && !empty($response['data'])) {
            return is_array($response['data']) ? ($response['data'][0] ?? $response['data']) : null;
        }
        return null;
    }
}

if (!function_exists('supabaseUpdateUserQuestionSubmission')) {
    function supabaseUpdateUserQuestionSubmission(int $id, array $data): bool {
        $data['updated_at'] = gmdate('c');
        return supabasePatch('UserQuestionSubmissions', ['id' => 'eq.' . $id], $data);
    }
}

// ============================================
// USER SUBMISSION IMAGES HELPERS
// ============================================

if (!function_exists('supabaseGetUserSubmissionImages')) {
    function supabaseGetUserSubmissionImages(int $submissionId): array {
        $result = supabaseSelect('UserSubmissionImages', ['submission_id' => 'eq.' . $submissionId, 'order' => 'uploaded_at.asc']);
        return $result ?: [];
    }
}

if (!function_exists('supabaseInsertUserSubmissionImage')) {
    function supabaseInsertUserSubmissionImage(int $submissionId, string $imagePath, ?string $imageUrl, string $originalFilename): bool {
        $payload = [
            'submission_id' => $submissionId,
            'image_path' => $imagePath,
            'image_url' => $imageUrl,
            'original_filename' => $originalFilename,
            'uploaded_at' => gmdate('c')
        ];
        return supabaseInsert('UserSubmissionImages', $payload);
    }
}

// ============================================
// ADMIN CREDENTIALS HELPERS
// ============================================

if (!function_exists('supabaseGetAdminByUsername')) {
    function supabaseGetAdminByUsername(string $username): ?array {
        return supabaseSelect('admin_credentials', ['username' => 'eq.' . $username, 'is_active' => 'eq.true'], '*', true);
    }
}

if (!function_exists('supabaseUpdateAdminLastLogin')) {
    function supabaseUpdateAdminLastLogin(int $id): bool {
        return supabasePatch('admin_credentials', ['id' => 'eq.' . $id], [
            'last_login' => gmdate('c'),
            'updated_at' => gmdate('c')
        ]);
    }
}

if (!function_exists('supabaseUpdateAdminPassword')) {
    function supabaseUpdateAdminPassword(int $id, string $passwordHash): bool {
        return supabasePatch('admin_credentials', ['id' => 'eq.' . $id], [
            'password_hash' => $passwordHash,
            'updated_at' => gmdate('c')
        ]);
    }
}

// ============================================
// OACOINS TRANSACTIONS HELPERS
// ============================================

if (!function_exists('supabaseGetOacoinsTransactions')) {
    function supabaseGetOacoinsTransactions(int $userId, int $limit = 50): array {
        $result = supabaseSelect('oacoins_transactions', [
            'user_id' => 'eq.' . $userId,
            'order' => 'created_at.desc',
            'limit' => $limit
        ]);
        return $result ?: [];
    }
}

if (!function_exists('supabaseInsertOacoinsTransaction')) {
    function supabaseInsertOacoinsTransaction(int $userId, int $amount, string $type, ?string $description = null, ?int $balanceAfter = null): bool {
        $payload = [
            'user_id' => $userId,
            'amount' => $amount,
            'transaction_type' => $type,
            'description' => $description,
            'balance_after' => $balanceAfter,
            'created_at' => gmdate('c')
        ];
        return supabaseInsert('oacoins_transactions', $payload);
    }
}

// ============================================
// PAGE VIEWS HELPERS
// ============================================

if (!function_exists('supabaseInsertPageView')) {
    function supabaseInsertPageView(string $pageName, ?string $userId = null, ?string $ipAddress = null, ?string $userAgent = null): bool {
        $payload = [
            'page_name' => $pageName,
            'user_id' => $userId,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'viewed_at' => gmdate('c')
        ];
        return supabaseInsert('page_views', $payload);
    }
}

// ============================================
// USER BOOKMARKS HELPERS
// ============================================

if (!function_exists('supabaseGetUserBookmarks')) {
    function supabaseGetUserBookmarks(int $userId): array {
        $result = supabaseSelect('UserBookmarks', ['user_id' => 'eq.' . $userId, 'order' => 'created_at.desc']);
        return $result ?: [];
    }
}

if (!function_exists('supabaseInsertUserBookmark')) {
    function supabaseInsertUserBookmark(int $userId, int $questionId, int $companyId, ?string $bookmarkType = 'favorite', ?string $notes = null): bool {
        $payload = [
            'user_id' => $userId,
            'question_id' => $questionId,
            'company_id' => $companyId,
            'bookmark_type' => $bookmarkType,
            'notes' => $notes,
            'created_at' => gmdate('c'),
            'updated_at' => gmdate('c')
        ];
        return supabaseInsert('UserBookmarks', $payload);
    }
}

if (!function_exists('supabaseDeleteUserBookmark')) {
    function supabaseDeleteUserBookmark(int $userId, int $questionId): bool {
        return supabaseDelete('UserBookmarks', ['user_id' => 'eq.' . $userId, 'question_id' => 'eq.' . $questionId]);
    }
}

// ============================================
// USER SOLVED QUESTIONS HELPERS
// ============================================

if (!function_exists('supabaseGetUserSolvedQuestions')) {
    function supabaseGetUserSolvedQuestions(string $userId): array {
        $result = supabaseSelect('user_solved_questions', ['user_id' => 'eq.' . $userId, 'order' => 'solved_at.desc']);
        return $result ?: [];
    }
}

if (!function_exists('supabaseInsertUserSolvedQuestion')) {
    function supabaseInsertUserSolvedQuestion(string $userId, int $questionId): bool {
        $payload = [
            'user_id' => $userId,
            'question_id' => $questionId,
            'solved_at' => gmdate('c')
        ];
        return supabaseInsert('user_solved_questions', $payload);
    }
}

// ============================================
// UTILITY HELPERS
// ============================================

if (!function_exists('supabaseRawQuery')) {
    /**
     * Execute a raw SQL query via Supabase RPC (requires a custom function)
     * For complex queries, consider creating an RPC function in Supabase
     */
    function supabaseRawQuery(string $query): ?array {
        // This requires setting up an RPC function in Supabase
        // For now, we'll use individual table queries
        return null;
    }
}

if (!function_exists('supabaseGetCompaniesWithQuestionCount')) {
    /**
     * Get companies with their question counts
     * This uses a workaround since we can't do JOINs directly via REST API
     */
    function supabaseGetCompaniesWithQuestionCount(int $limit = 20, int $offset = 0): array {
        $companies = supabaseGetCompanies($limit, $offset);
        foreach ($companies as &$company) {
            $company['question_count'] = supabaseCountQuestions($company['id']);
        }
        return $companies;
    }
}

if (!function_exists('supabaseGetQuestionCountsForCompanies')) {
    /**
     * Get question counts for multiple companies in a single query
     * This is much more efficient than making individual count requests
     */
    function supabaseGetQuestionCountsForCompanies(array $companyIds): array {
        if (empty($companyIds)) {
            return [];
        }
        
        // Use a single query to get all questions for these companies
        // and count them in PHP - faster than 100+ individual count requests
        $idsString = implode(',', array_map('intval', $companyIds));
        $filters = [
            'company_id' => 'in.(' . $idsString . ')',
            'select' => 'company_id'
        ];
        
        $response = supabaseRequest('GET', '/rest/v1/Questions', $filters);
        
        $counts = array_fill_keys($companyIds, 0);
        
        if ($response['success'] && is_array($response['data'])) {
            foreach ($response['data'] as $question) {
                $companyId = $question['company_id'];
                if (isset($counts[$companyId])) {
                    $counts[$companyId]++;
                }
            }
        }
        
        return $counts;
    }
}

if (!function_exists('supabaseGetRecentQuestionsForCompanies')) {
    /**
     * Get recent questions for multiple companies in a single query
     * This is much more efficient than making individual requests per company
     */
    function supabaseGetRecentQuestionsForCompanies(array $companyIds, int $perCompany = 2): array {
        if (empty($companyIds)) {
            return [];
        }
        
        // Get all questions for these companies, ordered by created_at
        $idsString = implode(',', array_map('intval', $companyIds));
        $filters = [
            'company_id' => 'in.(' . $idsString . ')',
            'select' => 'company_id,title,created_at',
            'order' => 'created_at.desc'
        ];
        
        $response = supabaseRequest('GET', '/rest/v1/Questions', $filters);
        
        $recentQuestions = [];
        foreach ($companyIds as $id) {
            $recentQuestions[$id] = [];
        }
        
        if ($response['success'] && is_array($response['data'])) {
            foreach ($response['data'] as $question) {
                $companyId = $question['company_id'];
                if (isset($recentQuestions[$companyId]) && count($recentQuestions[$companyId]) < $perCompany) {
                    $recentQuestions[$companyId][] = $question['title'];
                }
            }
        }
        
        return $recentQuestions;
    }
}

