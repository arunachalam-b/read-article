import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch the article
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
    }

    const html = await response.text();

    // Parse HTML with JSDOM
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Extract readable content using Readability
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return NextResponse.json({ error: 'Could not extract article content' }, { status: 500 });
    }

    // Clean up the text content by removing extra whitespace
    const cleanContent = article.textContent
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n\n')  // Keep paragraph breaks but clean up extra newlines
      .trim();

    return NextResponse.json({
      title: article.title,
      content: cleanContent,
      excerpt: article.excerpt
    });

  } catch (error) {
    console.error('Error extracting article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 