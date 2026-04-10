=== Simple WP Table of Contents Block ===
Contributors: samuelsena
Tags: table of contents, headings, gutenberg, block editor
Requires at least: 6.0
Tested up to: 6.9.3
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Add a dynamic table of contents block with block sidebar controls for managing which core Heading blocks are included.

== Description ==

Simple WP Table of Contents Block keeps the editing workflow simple:

* adds a Table of Contents block to the inserter
* works with the core Heading block only
* lists every heading from H1 through H6 in document order
* lets editors exclude headings from the table of contents
* adds stable, unique anchor IDs to included headings when the post is saved
* renders the table of contents dynamically from the current post content
* keeps the heading controls inside the selected Table of Contents block settings

The project source is maintained in `src/`, with the production assets generated from that source during the build step.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/simple-wp-toc` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the `Plugins` screen in WordPress.
3. Insert the `Table of Contents` block where you want the navigation to appear.
4. Select the `Table of Contents` block and use its block settings sidebar panel to include or exclude headings.

== Frequently Asked Questions ==

= Which headings are supported? =

The plugin only reads the core Heading block and supports levels H1 through H6.

= Does it add front-end markup by itself? =

Yes. The block renders a nested list of links from included Heading blocks in the current post.

= Does it work without the Table of Contents block inserted? =

No. Heading syncing starts when a Table of Contents block is present in the post editor.

== Changelog ==

= 1.0.0 =

* Initial release.
