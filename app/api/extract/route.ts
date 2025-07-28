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

    if (!article || !article.content) {
      return NextResponse.json({ error: 'Could not extract article content' }, { status: 500 });
    }

    // Convert HTML content to formatted text while preserving structure
    const tempDom = new JSDOM(article.content);
    const tempDoc = tempDom.window.document;
    
    // Convert HTML to text while preserving paragraph breaks
    const paragraphs: string[] = [];
    const pElements = tempDoc.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li');
    
    if (pElements.length > 0) {
      pElements.forEach(element => {
        const text = element.textContent?.trim();
        if (text && text.length > 0) {
          paragraphs.push(text);
        }
      });
    } else {
      // Fallback: split by line breaks if no paragraphs found
      const fallbackText = tempDoc.body?.textContent || article.textContent || '';
      const lines = fallbackText.split(/\n+/).filter(line => line.trim().length > 0);
      paragraphs.push(...lines);
    }

    // Join paragraphs with double line breaks
    const formattedContent = paragraphs.join('\n\n');

    return NextResponse.json({
      title: article.title,
      content: formattedContent,
      excerpt: article.excerpt
    });

  } catch (error) {
    console.error('Error extracting article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 