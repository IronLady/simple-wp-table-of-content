import { addFilter } from '@wordpress/hooks';

import { getHeadingSaveProps } from './utils';

let initialized = false;

function addHeadingAttributes( settings, name ) {
	if ( 'core/heading' !== name ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			excludeToc: {
				type: 'boolean',
				default: false,
			},
			tocSlug: {
				type: 'string',
				default: '',
			},
		},
	};
}

function addHeadingSaveProps( props, blockType, attributes ) {
	if ( 'core/heading' !== blockType.name ) {
		return props;
	}

	return getHeadingSaveProps( props, attributes );
}

/**
 * Register all heading-related filters once.
 *
 * @return {void}
 */
export default function initHeadingExtensions() {
	if ( initialized ) {
		return;
	}

	addFilter(
		'blocks.registerBlockType',
		'simple-wp-toc/heading-attributes',
		addHeadingAttributes,
	);
	addFilter(
		'blocks.getSaveContent.extraProps',
		'simple-wp-toc/save-props',
		addHeadingSaveProps,
	);

	initialized = true;
}
