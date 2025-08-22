import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting thread generation request")
    const { topic, sources, threadStyle } = await request.json()
    console.log("[v0] Request data:", { topic, sources, threadStyle })

    // Validate environment variables
    const kimiApiKey = process.env.KIMI_API_KEY
    const newsApiKey = process.env.NEWS_API_KEY
    const serpApiKey = process.env.SERP_API_KEY

    console.log("[v0] API keys check:", {
      kimi: !!kimiApiKey,
      news: !!newsApiKey,
      serp: !!serpApiKey,
    })

    if (!kimiApiKey || !newsApiKey || !serpApiKey) {
      console.log("[v0] Missing API keys")
      return NextResponse.json(
        { error: "Missing required API keys. Please check your environment variables." },
        { status: 500 },
      )
    }

    // Fetch content from selected sources
    const contentData = []
    console.log("[v0] Starting content fetching for sources:", sources)

    if (sources.includes("news")) {
      console.log("[v0] Fetching news content")
      const newsData = await fetchNewsContent(topic, newsApiKey)
      console.log("[v0] News data fetched:", newsData.length, "articles")
      contentData.push(...newsData)
    }

    if (sources.includes("research")) {
      console.log("[v0] Fetching research content")
      const researchData = await fetchResearchContent(topic)
      console.log("[v0] Research data fetched:", researchData.length, "papers")
      contentData.push(...researchData)
    }

    if (sources.includes("web")) {
      console.log("[v0] Fetching web content")
      const webData = await fetchWebContent(topic, serpApiKey)
      console.log("[v0] Web data fetched:", webData.length, "results")
      contentData.push(...webData)
    }

    console.log("[v0] Total content items:", contentData.length)

    const scoredContent = scoreViralPotential(contentData)
    const top5Content = scoredContent.slice(0, 5)
    console.log("[v0] Top 5 content selected based on viral potential")

    const threads = []
    for (let i = 0; i < top5Content.length; i++) {
      console.log(`[v0] Generating thread ${i + 1}/5`)
      const thread = await generateViralThread([top5Content[i]], threadStyle, kimiApiKey, i + 1)
      threads.push({
        content: top5Content[i],
        thread: thread,
        viralScore: top5Content[i].viralScore,
      })
    }

    console.log("[v0] All 5 threads generated successfully")

    return NextResponse.json({ threads, allSources: contentData })
  } catch (error) {
    console.error("[v0] Error generating thread:", error)
    return NextResponse.json({ error: "Failed to generate viral thread" }, { status: 500 })
  }
}

async function fetchNewsContent(topic: string, apiKey: string) {
  try {
    console.log("[v0] Making NewsAPI request for topic:", topic)
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`,
    )

    if (!response.ok) {
      console.log("[v0] NewsAPI response not ok:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    console.log("[v0] NewsAPI response:", data.status, data.totalResults)

    return (
      data.articles?.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        type: "news",
      })) || []
    )
  } catch (error) {
    console.error("[v0] Error fetching news:", error)
    return []
  }
}

async function fetchResearchContent(topic: string) {
  try {
    console.log("[v0] Making OpenAlex request for topic:", topic)
    const response = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(topic)}&sort=publication_date:desc&per-page=10`,
    )

    if (!response.ok) {
      console.log("[v0] OpenAlex response not ok:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    console.log("[v0] OpenAlex response:", data.results?.length, "results")

    return (
      data.results?.map((paper: any) => ({
        title: paper.title,
        description: paper.abstract_inverted_index ? "Research paper abstract available" : "No abstract available",
        url: paper.doi ? `https://doi.org/${paper.doi}` : paper.id,
        publishedAt: paper.publication_date,
        source: "OpenAlex Research",
        type: "research",
      })) || []
    )
  } catch (error) {
    console.error("[v0] Error fetching research:", error)
    return []
  }
}

async function fetchWebContent(topic: string, apiKey: string) {
  try {
    console.log("[v0] Making SERP API request for topic:", topic)
    const response = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(topic)}&api_key=${apiKey}&num=10`,
    )

    if (!response.ok) {
      console.log("[v0] SERP API response not ok:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    console.log("[v0] SERP API response:", data.organic_results?.length, "results")

    return (
      data.organic_results?.map((result: any) => ({
        title: result.title,
        description: result.snippet,
        url: result.link,
        publishedAt: new Date().toISOString(),
        source: "Web Search",
        type: "web",
      })) || []
    )
  } catch (error) {
    console.error("[v0] Error fetching web content:", error)
    return []
  }
}

function scoreViralPotential(contentData: any[]) {
  return contentData
    .map((item) => {
      let score = 0

      // Recency score (newer content gets higher score)
      const publishedDate = new Date(item.publishedAt)
      const now = new Date()
      const hoursSincePublished = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60)

      if (hoursSincePublished <= 24)
        score += 50 // Very recent
      else if (hoursSincePublished <= 72)
        score += 30 // Recent
      else if (hoursSincePublished <= 168) score += 10 // This week

      // Content type scoring
      if (item.type === "news") score += 30 // Breaking news is viral
      if (item.type === "research") score += 20 // Research can be viral if explained well
      if (item.type === "web") score += 25 // Web content varies

      // Title engagement scoring (look for viral keywords)
      const viralKeywords = [
        "breakthrough",
        "shocking",
        "revealed",
        "secret",
        "amazing",
        "incredible",
        "first",
        "new",
        "major",
        "huge",
        "massive",
        "game-changing",
        "revolutionary",
      ]
      const titleLower = item.title.toLowerCase()
      viralKeywords.forEach((keyword) => {
        if (titleLower.includes(keyword)) score += 15
      })

      // Length scoring (not too long, not too short)
      const titleLength = item.title.length
      if (titleLength >= 50 && titleLength <= 100) score += 10

      // Source credibility (some sources are more shareable)
      const credibleSources = ["reuters", "bbc", "cnn", "techcrunch", "wired", "nature", "science"]
      if (credibleSources.some((source) => item.source.toLowerCase().includes(source))) {
        score += 20
      }

      return { ...item, viralScore: score }
    })
    .sort((a, b) => b.viralScore - a.viralScore)
}

async function generateViralThread(contentData: any[], style: string, apiKey: string, threadNumber = 1) {
  try {
    console.log(`[v0] Generating thread ${threadNumber} with Kimi AI, content items:`, contentData.length)
    const content = contentData[0] // Single content item for focused thread

    const prompt = `Create a viral Twitter thread about this specific content in ${style} style:

Title: ${content.title}
Description: ${content.description}
Source: ${content.source}
Type: ${content.type}
Viral Score: ${content.viralScore}

Create an engaging thread with:
1. A powerful hook that grabs attention immediately
2. 6-10 tweets that tell a compelling story about this specific topic
3. Include surprising facts, insights, or implications
4. Use thread-friendly formatting with emojis and line breaks
5. End with a strong call-to-action

Format as numbered tweets (1/X, 2/X, etc.) and make it highly shareable.
Focus specifically on this one piece of content - don't mix in other topics.`

    console.log(`[v0] Making Kimi AI request for thread ${threadNumber}`)
    const response = await fetch("https://api.moonshot.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8, // Higher creativity for viral content
        max_tokens: 2000,
      }),
    })

    console.log(`[v0] Kimi AI response status for thread ${threadNumber}:`, response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`[v0] Kimi AI error response for thread ${threadNumber}:`, errorText)

      if (response.status === 401) {
        console.log(`[v0] Trying fallback endpoint for thread ${threadNumber}`)
        const fallbackResponse = await fetch("https://api.moonshot.cn/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "moonshot-v1-8k",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.8,
            max_tokens: 2000,
          }),
        })

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          return fallbackData.choices?.[0]?.message?.content || `Failed to generate thread ${threadNumber}`
        }
      }

      return `Failed to generate thread ${threadNumber} - API authentication error. Please verify your KIMI_API_KEY is correct.`
    }

    const data = await response.json()
    console.log(`[v0] Kimi AI response received successfully for thread ${threadNumber}`)
    return data.choices?.[0]?.message?.content || `Failed to generate thread ${threadNumber}`
  } catch (error) {
    console.error(`[v0] Error generating thread ${threadNumber} with Kimi AI:`, error)
    return `Failed to generate thread ${threadNumber} - Network error`
  }
}
