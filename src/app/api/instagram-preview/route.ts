import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 })

  try {
    const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&maxwidth=600&fields=thumbnail_url,title,author_name`
    const res = await fetch(oembedUrl)

    if (!res.ok) {
      const fallbackUrl = `https://www.instagram.com/oembed/?url=${encodeURIComponent(url)}&maxwidth=600`
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })

      if (!fallbackRes.ok) {
        return NextResponse.json({ error: 'Could not fetch preview' }, { status: 400 })
      }

      const data = await fallbackRes.json()
      return NextResponse.json({
        thumbnailUrl: data.thumbnail_url,
        authorName: data.author_name,
        title: data.title,
      })
    }

    const data = await res.json()
    return NextResponse.json({
      thumbnailUrl: data.thumbnail_url,
      authorName: data.author_name,
      title: data.title,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch Instagram preview' }, { status: 500 })
  }
}
