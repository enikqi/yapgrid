#!/usr/bin/env node
/**
 * LUMINA — static page builder.
 *
 * Assembles src/partials/* + src/pages/<slug>.html into flat HTML files at the
 * template root. The output is plain, dependency-free HTML: buyers can edit the
 * generated files directly and never run this script. It exists so the shared
 * header/footer stay in one place while the template is being developed.
 *
 *   node build.js
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const PARTIALS = path.join(SRC, "partials");
const PAGES = path.join(SRC, "pages");

/** Every page in the template, in navigation order. */
const MANIFEST = [
  {
    slug: "index.html",
    title: "Digital Agency",
    desc: "Lumina is an independent design and engineering studio building brands, products and the systems that hold them together.",
  },
  {
    slug: "home-portfolio.html",
    title: "Personal Portfolio",
    desc: "A personal portfolio home for designers, developers and creative freelancers who want their work to lead.",
  },
  {
    slug: "about.html",
    title: "About",
    desc: "How Lumina works: a small senior team, a clear process and a bias toward shipping.",
  },
  {
    slug: "services.html",
    title: "Services",
    desc: "Brand identity, product design, web engineering and design systems — delivered end to end.",
  },
  {
    slug: "service-details.html",
    title: "Product Design",
    desc: "Research, interface design and design systems that make complex products feel obvious.",
  },
  {
    slug: "portfolio.html",
    title: "Portfolio",
    desc: "Selected work across brand identity, product design, web platforms and motion.",
  },
  {
    slug: "portfolio-details.html",
    title: "Meridian Case Study",
    desc: "How we rebuilt a financial dashboard around one question: what does the user need to decide right now?",
  },
  {
    slug: "team.html",
    title: "Team",
    desc: "The people behind Lumina — designers, engineers and strategists who ship together.",
  },
  {
    slug: "team-details.html",
    title: "Ava Lindqvist",
    desc: "Founder and design director at Lumina, working across brand systems and product interfaces.",
  },
  {
    slug: "pricing.html",
    title: "Pricing",
    desc: "Transparent engagement models — from focused sprints to an embedded product partnership.",
  },
  {
    slug: "blog.html",
    title: "Journal",
    desc: "Notes on design systems, interface craft, performance and the business of running a studio.",
  },
  {
    slug: "blog-details.html",
    title: "Designing for Restraint",
    desc: "Why the strongest interfaces are the ones that refuse to show you everything at once.",
  },
  {
    slug: "faq.html",
    title: "FAQ",
    desc: "Answers on process, timelines, pricing, handover and what working with Lumina looks like.",
  },
  {
    slug: "contact.html",
    title: "Contact",
    desc: "Tell us about your project. We reply to every enquiry within two working days.",
  },
  {
    slug: "404.html",
    title: "Page Not Found",
    desc: "That page has moved or never existed. Here are a few places worth trying instead.",
  },
  {
    slug: "coming-soon.html",
    title: "Coming Soon",
    desc: "Something new is on the way. Leave your email and we'll tell you the moment it lands.",
  },
];

function read(file) {
  return fs.readFileSync(file, "utf8").trim();
}

/** Adds .is-current to the nav item whose data-nav lists this slug. */
function markActive(header, slug) {
  return header.replace(/<li data-nav="([^"]+)"/g, (match, list) => {
    const slugs = list.split(/\s+/);
    return slugs.indexOf(slug) !== -1
      ? '<li class="is-current" data-nav="' + list + '"'
      : match;
  });
}

function fill(template, page) {
  return template
    .replace(/\{\{TITLE\}\}/g, page.title)
    .replace(/\{\{DESC\}\}/g, page.desc)
    .replace(/\{\{SLUG\}\}/g, page.slug === "index.html" ? "" : page.slug);
}

function build() {
  const head = read(path.join(PARTIALS, "head.html"));
  const header = read(path.join(PARTIALS, "header.html"));
  const footer = read(path.join(PARTIALS, "footer.html"));
  const scripts = read(path.join(PARTIALS, "scripts.html"));

  let built = 0;
  const missing = [];

  MANIFEST.forEach((page) => {
    const source = path.join(PAGES, page.slug);

    if (!fs.existsSync(source)) {
      missing.push(page.slug);
      return;
    }

    const body = read(source);
    const bare = page.slug === "404.html" || page.slug === "coming-soon.html";

    const html =
      "<!doctype html>\n" +
      '<html lang="en" data-theme="dark">\n' +
      "<head>\n" +
      fill(head, page) +
      "\n</head>\n" +
      '<body data-page="' +
      page.slug +
      '">\n\n' +
      (bare ? "" : markActive(header, page.slug) + "\n\n") +
      '<main id="main">\n' +
      body +
      "\n</main>\n\n" +
      (bare ? "" : footer + "\n\n") +
      scripts +
      "\n</body>\n</html>\n";

    fs.writeFileSync(path.join(ROOT, page.slug), html, "utf8");
    built++;
    process.stdout.write("  built  " + page.slug + "\n");
  });

  process.stdout.write("\n" + built + "/" + MANIFEST.length + " pages built\n");

  if (missing.length) {
    process.stdout.write("  missing: " + missing.join(", ") + "\n");
    process.exitCode = 1;
  }
}

build();
