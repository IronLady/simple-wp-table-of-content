<?php
/**
 * Core plugin bootstrap.
 *
 * @package SimpleWPToc
 */

namespace SimpleWPToc\Core;

/**
 * Register plugin hooks.
 *
 * @return void
 */
function setup() {
	add_action( 'init', __NAMESPACE__ . '\i18n' );
	add_action( 'init', __NAMESPACE__ . '\register_block' );
}

/**
 * Registers the default textdomain.
 *
 * @return void
 */
function i18n() {
	load_plugin_textdomain(
		'simple-wp-toc',
		false,
		dirname( plugin_basename( SIMPLE_WP_TOC_FILE ) ) . '/languages/'
	);
}

/**
 * Register the table of contents block and its editor assets.
 *
 * @return void
 */
function register_block() {
	$asset_file = SIMPLE_WP_TOC_BUILD_PATH . 'index.asset.php';
	$metadata   = SIMPLE_WP_TOC_BUILD_PATH . 'block';

	if ( ! file_exists( $asset_file ) || ! file_exists( $metadata . '/block.json' ) ) {
		return;
	}

	$asset = require $asset_file;

	wp_register_script(
		'simple-wp-toc-editor',
		SIMPLE_WP_TOC_BUILD_URL . 'index.js',
		$asset['dependencies'],
		$asset['version'],
		true
	);

	wp_set_script_translations(
		'simple-wp-toc-editor',
		'simple-wp-toc',
		SIMPLE_WP_TOC_PATH . 'languages'
	);

	wp_register_style(
		'simple-wp-toc-style',
		false,
		[],
		SIMPLE_WP_TOC_VERSION
	);
	wp_add_inline_style(
		'simple-wp-toc-style',
		get_block_styles()
	);

	wp_register_script(
		'simple-wp-toc-view',
		false,
		[],
		SIMPLE_WP_TOC_VERSION,
		true
	);
	wp_add_inline_script(
		'simple-wp-toc-view',
		get_view_script()
	);

	register_block_type(
		$metadata,
		[
			'render_callback' => __NAMESPACE__ . '\render_table_of_contents',
			'uses_context'    => [
				'postId',
				'postType',
			],
		]
	);
}

/**
 * Get inline styles for the block output.
 *
 * @return string
 */
function get_block_styles() {
	return '.simple-wp-toc__list{list-style:none;margin:0;padding-left:0;}' .
		'.simple-wp-toc__list .simple-wp-toc__list{padding-left:0.75rem;}' .
		'.simple-wp-toc__item{margin:0;}' .
		'.simple-wp-toc__link{text-decoration:none;}' .
		'.simple-wp-toc__title{margin:0 0 0.75rem;}';
}

/**
 * Get frontend script for scrolling to headings.
 *
 * @return string
 */
function get_view_script() {
	return "(function(){document.addEventListener('click',function(event){var link=event.target.closest('.simple-wp-toc__link');if(!link){return;}var hash=link.getAttribute('href');if(!hash||'#'===hash.charAt(0)&&1===hash.length){return;}var target=document.getElementById(hash.slice(1));if(!target){return;}event.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});if(window.history&&window.history.pushState){window.history.pushState(null,'',hash);}else{window.location.hash=hash;}});})();";
}

/**
 * Collect included heading blocks recursively.
 *
 * @param array             $blocks      Parsed blocks.
 * @param array             $headings    Heading accumulator.
 * @param array<string,int> $slug_counts Running slug counts.
 * @return void
 */
function collect_heading_blocks( array $blocks, array &$headings, array &$slug_counts ) {
	foreach ( $blocks as $block ) {
		if ( 'core/heading' === $block['blockName'] ) {
			$attributes = isset( $block['attrs'] ) ? $block['attrs'] : [];

			if ( empty( $attributes['excludeToc'] ) ) {
				$text = wp_strip_all_tags( (string) ( $attributes['content'] ?? '' ) );

				if ( '' !== trim( $text ) ) {
					$slug = get_heading_slug( $attributes, $text, $slug_counts );

					$headings[] = [
						'level' => isset( $attributes['level'] ) ? (int) $attributes['level'] : 2,
						'slug'  => $slug,
						'text'  => $text,
					];
				}
			}
		}

		if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
			collect_heading_blocks( $block['innerBlocks'], $headings, $slug_counts );
		}
	}
}

/**
 * Collect included headings from saved post markup.
 *
 * @param string $content Raw post content.
 * @return array
 */
function collect_headings_from_markup( $content ) {
	if ( ! class_exists( '\DOMDocument' ) || '' === trim( $content ) ) {
		return [];
	}

	$document = new \DOMDocument();
	$headings = [];
	$xpath    = null;

	libxml_use_internal_errors( true );
	$document->loadHTML(
		'<?xml encoding="utf-8" ?><body>' . $content . '</body>',
		LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
	);
	libxml_clear_errors();
	$xpath = new \DOMXPath( $document );

	$nodes = $xpath->query( '//h1 | //h2 | //h3 | //h4 | //h5 | //h6' );

	if ( ! $nodes ) {
		return [];
	}

	foreach ( $nodes as $node ) {
		$class_name = $node->attributes->getNamedItem( 'class' );
		$id_attr    = $node->attributes->getNamedItem( 'id' );
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$classes = $class_name ? preg_split( '/\s+/', trim( $class_name->nodeValue ) ) : [];
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$level = (int) str_replace( 'h', '', strtolower( $node->nodeName ) );

		if ( empty( $id_attr ) || ! in_array( 'is-simple-wp-toc-heading', $classes, true ) ) {
			continue;
		}

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$text = trim( wp_strip_all_tags( $node->textContent ) );

		if ( '' === $text ) {
			continue;
		}

		$headings[] = [
			'level' => $level,
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			'slug'  => sanitize_title( $id_attr->nodeValue ),
			'text'  => $text,
		];
	}

	return $headings;
}

/**
 * Get a unique slug for a heading.
 *
 * @param array             $attributes Heading block attributes.
 * @param string            $text       Heading text.
 * @param array<string,int> $slug_counts Running slug counts.
 * @return string
 */
function get_heading_slug( array $attributes, $text, array &$slug_counts ) {
	$slug = isset( $attributes['tocSlug'] ) ? sanitize_title( $attributes['tocSlug'] ) : '';

	if ( '' === $slug ) {
		$base_slug  = sanitize_title( $text );
		$base_slug  = '' !== $base_slug ? $base_slug : 'heading';
		$occurrence = isset( $slug_counts[ $base_slug ] ) ? $slug_counts[ $base_slug ] + 1 : 1;

		$slug_counts[ $base_slug ] = $occurrence;
		$slug                      = 1 === $occurrence ? $base_slug : $base_slug . '-' . $occurrence;
	}

	return $slug;
}

/**
 * Build a nested heading tree from a flat heading list.
 *
 * @param array $headings Flat heading list.
 * @return array
 */
function build_heading_tree( array $headings ) {
	$tree  = [];
	$stack = [];

	foreach ( $headings as $heading ) {
		$node = $heading + [ 'children' => [] ];

		while ( ! empty( $stack ) && end( $stack )['level'] >= $node['level'] ) {
			array_pop( $stack );
		}

		if ( ! empty( $stack ) ) {
			$parent_index                         = count( $stack ) - 1;
			$stack[ $parent_index ]['children'][] = $node;
			$stack[]                              = &$stack[ $parent_index ]['children'][ count( $stack[ $parent_index ]['children'] ) - 1 ];
		} else {
			$tree[]  = $node;
			$stack[] = &$tree[ count( $tree ) - 1 ];
		}

		unset( $node );
	}

	return $tree;
}

/**
 * Render a nested TOC list.
 *
 * @param array $items Nested heading items.
 * @return string
 */
function render_heading_list( array $items ) {
	if ( empty( $items ) ) {
		return '';
	}

	$markup = '<ul class="simple-wp-toc__list">';

	foreach ( $items as $item ) {
		$markup .= '<li class="simple-wp-toc__item">';
		$markup .= sprintf(
			'<a class="simple-wp-toc__link" href="#%1$s">%2$s</a>',
			esc_attr( $item['slug'] ),
			esc_html( $item['text'] )
		);

		if ( ! empty( $item['children'] ) ) {
			$markup .= render_heading_list( $item['children'] );
		}

		$markup .= '</li>';
	}

	$markup .= '</ul>';

	return $markup;
}

/**
 * Resolve the current post ID for dynamic block rendering.
 *
 * @param \WP_Block|null $block Parsed block instance.
 * @return int
 */
function get_current_post_id( $block = null ) {
	if ( $block instanceof \WP_Block && ! empty( $block->context['postId'] ) ) {
		return (int) $block->context['postId'];
	}

	$current_post = get_post();

	if ( $current_post instanceof \WP_Post ) {
		return (int) $current_post->ID;
	}

	$post_id = get_the_ID();

	if ( $post_id ) {
		return (int) $post_id;
	}

	$post_id = get_queried_object_id();

	return $post_id ? (int) $post_id : 0;
}

/**
 * Render the table of contents block.
 *
 * @param array     $attributes Block attributes.
 * @param string    $content Block content.
 * @param \WP_Block $block Parsed block instance.
 * @return string
 */
function render_table_of_contents( $attributes = [], $content = '', $block = null ) {
	unset( $attributes, $content );

	$post_id = get_current_post_id( $block );

	if ( ! $post_id ) {
		return '';
	}

	$post = get_post( $post_id );

	if ( ! $post instanceof \WP_Post ) {
		return '';
	}

	$headings    = [];
	$slug_counts = [];

	$headings = collect_headings_from_markup( $post->post_content );

	if ( empty( $headings ) ) {
		collect_heading_blocks( parse_blocks( $post->post_content ), $headings, $slug_counts );
	}

	if ( empty( $headings ) ) {
		return '';
	}

	$tree               = build_heading_tree( $headings );
	$wrapper_attributes = get_block_wrapper_attributes(
		[
			'class' => 'simple-wp-toc',
		]
	);

	return sprintf(
		'<nav %1$s aria-label="%2$s"><p class="simple-wp-toc__title">%3$s</p>%4$s</nav>',
		$wrapper_attributes,
		esc_attr__( 'Table of Contents', 'simple-wp-toc' ),
		esc_html__( 'Table of Contents', 'simple-wp-toc' ),
		render_heading_list( $tree )
	);
}
