import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "OAHelper - Ace Your Online Assessments", 
  description = "OAHelper: Your ultimate resource for Online Assessment (OA) questions from top companies. Practice real interview questions with solutions to ace your coding interviews.",
  keywords = "Online Assessment, OA, Coding Interview, Interview Questions, Tech Interview, Programming Challenges, Data Structures, Algorithms, Interview Prep, Company Questions, Solved Problems, Software Engineer Interview",
  canonical = window.location.href,
  image = "/logo512.png",
  type = "website",
  structuredData = null,
  companyName = null,
  questionCount = null
}) => {
  // Enhanced title for company pages
  const enhancedTitle = companyName 
    ? `${companyName} Interview Questions & Online Assessment | OAHelper`
    : title;

  // Enhanced description for company pages  
  const enhancedDescription = companyName
    ? `Practice ${companyName} online assessment questions with detailed solutions. ${questionCount || 'Multiple'} coding interview questions to help you ace your ${companyName} interview. Free practice problems with explanations.`
    : description;

  // Enhanced keywords for company pages
  const enhancedKeywords = companyName
    ? `${companyName} interview questions, ${companyName} online assessment, ${companyName} coding interview, ${companyName} OA, ${companyName} programming questions, ${keywords}`
    : keywords;

  // Create structured data for company/questions
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "OAHelper",
    "url": "https://oahelper.in",
    "description": "Ultimate resource for Online Assessment (OA) questions from top companies",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://oahelper.in/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "OAHelper",
      "logo": {
        "@type": "ImageObject",
        "url": "https://oahelper.in/logo512.png"
      }
    }
  };

  const companyStructuredData = companyName ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${companyName} Interview Questions`,
    "description": `Collection of ${companyName} online assessment and coding interview questions`,
    "url": canonical,
    "isPartOf": {
      "@type": "WebSite",
      "name": "OAHelper",
      "url": "https://oahelper.in"
    },
    "about": {
      "@type": "Organization",
      "name": companyName
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": questionCount || 0,
      "itemListElement": []
    }
  } : null;

  const finalStructuredData = structuredData || companyStructuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{enhancedTitle}</title>
      <meta name="description" content={enhancedDescription} />
      <meta name="keywords" content={enhancedKeywords} />
      <meta name="author" content="OAHelper Team" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={enhancedTitle} />
      <meta property="og:description" content={enhancedDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="OAHelper" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={enhancedTitle} />
      <meta name="twitter:description" content={enhancedDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@oahelper" />
      <meta name="twitter:creator" content="@oahelper" />

      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="application-name" content="OAHelper" />
      <meta name="apple-mobile-web-app-title" content="OAHelper" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;


