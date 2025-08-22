"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Zap, TrendingUp, Sparkles, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ContentItem {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
  type: string
  viralScore?: number
}

interface ThreadData {
  content: ContentItem
  thread: string
  viralScore: number
}

export default function ViralPostGenerator() {
  const [query, setQuery] = useState("")
  const [sources, setSources] = useState<string[]>(["news"])
  const [threadStyle, setThreadStyle] = useState("breaking_news")
  const [isSearching, setIsSearching] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchResults, setSearchResults] = useState<ContentItem[]>([])
  const [generatedThreads, setGeneratedThreads] = useState<ThreadData[]>([])
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setSearchResults([])
    setGeneratedThreads([])

    try {
      const response = await fetch("/api/generate-thread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: query,
          sources,
          threadStyle,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate content")
      }

      setSearchResults(data.allSources || [])
      setGeneratedThreads(data.threads || [])

      toast({
        title: "Success!",
        description: `Generated ${data.threads?.length || 0} viral threads from top content`,
      })
    } catch (error) {
      console.error("[v0] Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Thread copied to clipboard",
    })
  }

  const handleSourceChange = (source: string, checked: boolean) => {
    if (checked) {
      setSources((prev) => [...prev, source])
    } else {
      setSources((prev) => prev.filter((s) => s !== source))
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-20" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold gradient-text font-sans">Flock</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
              The viral content engine that never sleeps. We hunt down breaking stories, research breakthroughs, and
              trending conversations—then craft them into threads that stop the scroll.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <Badge variant="secondary" className="bg-primary/20 text-primary font-sans">
                <Zap className="w-3 h-3 mr-1" />
                AI-Powered Discovery
              </Badge>
              <Badge variant="secondary" className="bg-secondary/20 text-secondary font-sans">
                <TrendingUp className="w-3 h-3 mr-1" />
                Real-time Intelligence
              </Badge>
              <Badge variant="secondary" className="bg-accent/20 text-accent font-sans">
                <Sparkles className="w-3 h-3 mr-1" />
                Viral Optimization
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-sans">
                  <Search className="w-5 h-5" />
                  Content Discovery
                </CardTitle>
                <CardDescription className="font-sans">
                  Hunt down the stories everyone will be talking about tomorrow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="query" className="font-sans">
                    What's happening?
                  </Label>
                  <Input
                    id="query"
                    placeholder="AI breakthrough, startup drama, market chaos..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-sans">Intelligence Sources</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="news"
                        checked={sources.includes("news")}
                        onCheckedChange={(checked) => handleSourceChange("news", checked as boolean)}
                      />
                      <Label htmlFor="news" className="text-sm font-sans">
                        📰 Breaking News
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="research"
                        checked={sources.includes("research")}
                        onCheckedChange={(checked) => handleSourceChange("research", checked as boolean)}
                      />
                      <Label htmlFor="research" className="text-sm font-sans">
                        🔬 Research Papers
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="web"
                        checked={sources.includes("web")}
                        onCheckedChange={(checked) => handleSourceChange("web", checked as boolean)}
                      />
                      <Label htmlFor="web" className="text-sm font-sans">
                        🌐 Web Intelligence
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thread-style" className="font-sans">
                    Thread Personality
                  </Label>
                  <Select value={threadStyle} onValueChange={setThreadStyle}>
                    <SelectTrigger className="font-sans transition-all duration-200 ease-in-out hover:bg-accent/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      className="transition-all duration-200 ease-in-out animate-in slide-in-from-top-2 z-50 bg-gradient-to-b from-black/95 via-purple-900/90 to-black/95 backdrop-blur-md border border-purple-500/20"
                      side="bottom"
                      align="start"
                      sideOffset={4}
                      avoidCollisions={true}
                    >
                      <SelectItem
                        value="breaking_news"
                        className="font-sans transition-colors duration-150 hover:bg-purple-500/20 focus:bg-purple-500/20"
                      >
                        🚨 Breaking & Urgent
                      </SelectItem>
                      <SelectItem
                        value="controversial"
                        className="font-sans transition-colors duration-150 hover:bg-purple-500/20 focus:bg-purple-500/20"
                      >
                        🔥 Hot Takes & Debate
                      </SelectItem>
                      <SelectItem
                        value="educational"
                        className="font-sans transition-colors duration-150 hover:bg-purple-500/20 focus:bg-purple-500/20"
                      >
                        📚 Deep Dive & Insights
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={!query.trim() || sources.length === 0 || isSearching}
                  className="w-full gradient-primary font-sans"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Hunting viral content...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Generate Viral Threads
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {generatedThreads.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold font-sans">🔥 Your Viral Arsenal</h2>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(generatedThreads.map((t) => t.thread).join("\n\n---\n\n"))}
                    className="font-sans"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Threads
                  </Button>
                </div>

                <div className="space-y-6">
                  {generatedThreads.map((threadData, index) => (
                    <Card key={index} className="gradient-card">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2 font-sans">
                              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              {threadData.content.title}
                            </CardTitle>
                            <CardDescription className="mt-2 font-sans">
                              {threadData.content.description}
                            </CardDescription>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs font-sans">
                                {threadData.content.source}
                              </Badge>
                              <Badge variant="secondary" className="text-xs font-sans">
                                Viral Score: {threadData.viralScore}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(threadData.content.url, "_blank")}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(threadData.thread)}
                            className="font-sans"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={threadData.thread}
                          readOnly
                          className="min-h-[300px] font-mono text-sm resize-none leading-relaxed"
                        />
                        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground font-sans">
                          <span>📝 {threadData.thread.split("\n").filter((line) => line.trim()).length} tweets</span>
                          <span>
                            ⏱️ ~{Math.ceil(threadData.thread.split("\n").filter((line) => line.trim()).length * 15)}s
                            read time
                          </span>
                          <span>🔥 Optimized for maximum engagement</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold font-sans">
                      Intelligence Gathered ({searchResults.length} sources)
                    </h3>
                    <div className="grid gap-3 max-h-96 overflow-y-auto">
                      {searchResults.map((item, index) => (
                        <Card key={index} className="gradient-card">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm font-sans">{item.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1 font-sans leading-relaxed">
                                  {item.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs font-sans">
                                    {item.source}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground font-sans">{item.type}</span>
                                  {item.viralScore && (
                                    <Badge variant="secondary" className="text-xs font-sans">
                                      Score: {item.viralScore}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => window.open(item.url, "_blank")}>
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card className="gradient-card">
                <CardContent className="py-16 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                      <Search className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-3xl font-bold gradient-text font-sans">Ready to Break the Internet?</h3>
                    <p className="text-lg text-muted-foreground max-w-lg mx-auto font-sans leading-relaxed">
                      Tell us what's on your mind. We'll scour the web for the hottest takes, latest breakthroughs, and
                      trending conversations—then turn them into threads that demand attention.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
