<?php
/**
 * Plugin Name:       Simple WP Table of Contents Block
 * Description:       Adds a dynamic table of contents block with block-sidebar controls for core Heading blocks.
 * Version:           1.0.1
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Samuel Sena
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       simple-wp-toc
 * Domain Path:       /languages
 *
 * @package           SimpleWPToc
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'SIMPLE_WP_TOC_VERSION', '1.0.1' );
define( 'SIMPLE_WP_TOC_FILE', __FILE__ );
define( 'SIMPLE_WP_TOC_URL', plugin_dir_url( __FILE__ ) );
define( 'SIMPLE_WP_TOC_PATH', plugin_dir_path( __FILE__ ) );
define( 'SIMPLE_WP_TOC_INC', SIMPLE_WP_TOC_PATH . 'includes/' );
define( 'SIMPLE_WP_TOC_BUILD_URL', SIMPLE_WP_TOC_URL . 'build/' );
define( 'SIMPLE_WP_TOC_BUILD_PATH', SIMPLE_WP_TOC_PATH . 'build/' );

require_once SIMPLE_WP_TOC_INC . '/core.php';

SimpleWPToc\Core\setup();
