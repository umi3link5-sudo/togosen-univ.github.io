/**
 * Markdown Utilities using marked.js & DOMPurify
 */

// Generate a clean slug for heading IDs
export function generateSlug(text) {
  return encodeURIComponent(
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5ぁ-んァ-ヶ\- ]+/g, "") // Keep alphanumeric, CJK characters, space, hyphen
      .replace(/\s+/g, "-")
  );
}

/**
 * Extracts headings from Markdown content for Table of Contents
 * @param {string} markdown 
 * @returns {Array<{level: number, text: string, id: string}>}
 */
export function extractTOC(markdown) {
  const headings = [];
  const lines = markdown.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    // Skip code blocks
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Match h2 (## Heading) and h3 (### Heading)
    const match = line.match(/^(##|###)\s+(.+)$/);
    if (match) {
      const level = match[1].length; // 2 or 3
      const text = match[2].replace(/\[\^.+\]/g, "").trim(); // Remove footnote references from TOC text
      const id = generateSlug(text);
      headings.push({ level, text, id });
    }
  }

  return headings;
}

/**
 * Custom preprocess for Footnotes (Alerts are processed in custom blockquote renderer to avoid ReDoS)
 */
function preprocessCustomMarkdown(markdown) {
  let processed = markdown;

  // 1. Custom Components Preprocessing
  
  // A. Badges: [badge: text | type]
  processed = processed.replace(/\[badge:\s*(.+?)\]/g, (m, rawText) => {
    const parts = rawText.split("|");
    const label = parts[0].trim();
    const type = parts[1] ? parts[1].trim() : "default";
    return `<span class="custom-badge badge-${type}">${label}</span>`;
  });

  // B. Card Grid: [card-grid] ... [/card-grid]
  processed = processed.replace(/\[card-grid\]/g, '<div class="custom-card-grid">');
  processed = processed.replace(/\[\/card-grid\]/g, '</div>');

  // C. Cards: [card: title | body | footer]
  processed = processed.replace(/\[card:\s*(.+?)\]/g, (m, rawText) => {
    const parts = rawText.split("|");
    const title = parts[0] ? parts[0].trim() : "";
    const body = parts[1] ? parts[1].trim() : "";
    const footer = parts[2] ? parts[2].trim() : "";
    
    let html = `<div class="custom-card">`;
    if (title) html += `<div class="custom-card-title">${title}</div>`;
    if (body) html += `<div class="custom-card-body">${body}</div>`;
    if (footer) html += `<div class="custom-card-footer">${footer}</div>`;
    html += `</div>`;
    return html;
  });

  // D. Steps Container: [steps] ... [/steps]
  processed = processed.replace(/\[steps\]/g, '<div class="custom-steps">');
  processed = processed.replace(/\[\/steps\]/g, '</div>');

  // E. Individual Step: [step: title] body [/step]
  processed = processed.replace(/\[step:\s*(.+?)\]([\s\S]*?)\[\/step\]/g, (m, title, body) => {
    return `<div class="custom-step"><div class="custom-step-header"><div class="custom-step-indicator"></div><h4 class="custom-step-title">${title}</h4></div><div class="custom-step-body">${body.trim()}</div></div>`;
  });

  // 2. Footnotes preprocessing
  // Find definitions: [^1]: This is a footnote
  const footnotes = [];
  const footnoteDefRegex = /^\[\^([^\]]+)\]:\s+(.+)$/gm;
  
  // Extract and strip definitions
  processed = processed.replace(footnoteDefRegex, (m, id, text) => {
    footnotes.push({ id, text });
    return ""; // Remove definition from normal content flow
  });

  // Replace inline references: [^1]
  processed = processed.replace(/\[\^([^\]]+)\]/g, (m, id) => {
    return `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}">[${id}]</a></sup>`;
  });

  // Append footnotes to the end of the markdown if any exist
  if (footnotes.length > 0) {
    processed += "\n\n---\n\n### 脚注\n\n<div class=\"footnotes\">\n<ol>\n";
    footnotes.forEach(fn => {
      processed += `<li id="fn-${fn.id}">${fn.text} <a href="#fnref-${fn.id}" class="footnote-backref">↩</a></li>\n`;
    });
    processed += "</ol>\n</div>";
  }

  return processed;
}

/**
 * Renders Markdown to sanitized HTML with custom rendering hooks
 * @param {string} markdown 
 * @returns {string} Sanitized HTML string
 */
export function renderMarkdown(markdown) {
  if (!markdown) return "";
  
  const preprocessed = preprocessCustomMarkdown(markdown);
  
  // Custom marked renderer to inject custom heading IDs and style blockquotes
  const renderer = new window.marked.Renderer();

  // Custom Image URL Resolver for uploaded images
  renderer.image = function(href, title, text) {
    let cleanHref = "";
    let imgTitle = "";
    let imgAlt = "";

    if (typeof href === 'object' && href !== null) {
      cleanHref = href.href || "";
      imgTitle = href.title || "";
      imgAlt = href.text || "";
    } else {
      cleanHref = href || "";
      imgTitle = title || "";
      imgAlt = text || "";
    }

    // Convert local upload paths to GitHub raw URLs if settings exist (enables instant preview)
    if (cleanHref && cleanHref.startsWith("images/uploads/")) {
      try {
        const settings = JSON.parse(localStorage.getItem("togosen_github_settings") || "{}");
        if (settings.owner && settings.repo) {
          const branch = settings.branch || "main";
          cleanHref = `https://raw.githubusercontent.com/${settings.owner}/${settings.repo}/${branch}/${cleanHref}`;
        }
      } catch (e) {
        console.error("Failed to parse GitHub settings for image URL conversion:", e);
      }
    }

    const titleAttr = imgTitle ? ` title="${imgTitle}"` : '';
    const altAttr = imgAlt ? ` alt="${imgAlt}"` : '';
    return `<img src="${cleanHref}"${altAttr}${titleAttr}>`;
  };
  
  // Custom Heading ID generation
  renderer.heading = function(text, level, raw) {
    let headingText = "";
    let headingLevel = 1;
    let headingRaw = "";

    if (typeof text === 'object' && text !== null) {
      headingText = text.text || "";
      headingLevel = text.level || 1;
      headingRaw = text.raw || headingText;
    } else {
      headingText = text || "";
      headingLevel = level || 1;
      headingRaw = raw || headingText;
    }

    const plainText = headingRaw.replace(/<[^>]*>/g, "").replace(/\[\^.+\]/g, "").trim();
    const id = generateSlug(plainText);
    
    // We only create TOC links for h2 and h3
    if (headingLevel === 2 || headingLevel === 3) {
      return `<h${headingLevel} id="${id}">${headingText}</h${headingLevel}>`;
    }
    return `<h${headingLevel}>${headingText}</h${headingLevel}>`;
  };

  // Custom Blockquote parsing for alerts (Safe parsing inside blockquote content to avoid ReDoS)
  renderer.blockquote = function(quote) {
    let content = "";
    if (typeof quote === 'object' && quote !== null) {
      content = quote.text || "";
    } else {
      content = quote || "";
    }

    // Match GitHub-style alerts like [!NOTE], [!IMPORTANT], etc.
    const match = content.match(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
    if (match) {
      const type = match[1].toLowerCase();
      const upperType = type.toUpperCase();
      // Remove the alert tag and its optional trailing line break/spacing cleanly
      const cleanQuote = content.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*<br\s*\/?>)?\s*/i, "");
      return `<blockquote class="alert-${type}"><div class="alert-badge alert-${type}">${upperType}</div>\n${cleanQuote}</blockquote>`;
    }
    return `<blockquote>${content}</blockquote>`;
  };

  // Custom link parser to open external links in new tab
  renderer.link = function(href, title, text) {
    let cleanHref = "";
    let linkTitle = "";
    let linkText = "";

    if (typeof href === 'object' && href !== null) {
      cleanHref = href.href || "";
      linkTitle = href.title || "";
      linkText = href.text || "";
    } else {
      cleanHref = href || "";
      linkTitle = title || "";
      linkText = text || "";
    }

    // Auto protocol prepend for external domains if missing
    if (cleanHref && !cleanHref.startsWith("http") && !cleanHref.startsWith("/") && !cleanHref.startsWith("#")) {
      if (cleanHref.includes("youtube.com") || cleanHref.includes("youtu.be") || cleanHref.includes("github.com")) {
        cleanHref = "https://" + cleanHref;
      }
    }
    const isExternal = cleanHref.startsWith("http");
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    const titleAttr = linkTitle ? ` title="${linkTitle}"` : '';
    return `<a href="${cleanHref}"${targetAttr}${titleAttr}>${linkText}</a>`;
  };

  const options = {
    renderer: renderer,
    gfm: true,
    breaks: true,
    headerIds: false // We handle IDs manually in heading renderer
  };

  const rawHtml = window.marked.parse(preprocessed, options);
  
  // Sanitize raw HTML using DOMPurify
  return window.DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'a', 'p', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 
      'img', 'strong', 'em', 'del', 'sup', 'sub'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'title', 'class', 'id', 'src', 'alt', 'style'],
  });
}
