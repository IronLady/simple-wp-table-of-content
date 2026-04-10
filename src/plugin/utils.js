const HEADING_CLASS_NAME = 'is-simple-wp-toc-heading';

/**
 * Extract readable text from saved heading content.
 *
 * @param {string} content Heading HTML content.
 * @return {string} Plain text heading label.
 */
export function getHeadingText( content = '' ) {
	if ( ! content ) {
		return '';
	}

	if ( typeof document !== 'undefined' ) {
		const element = document.createElement( 'div' );
		element.innerHTML = content;

		return element.textContent.trim();
	}

	return content.replace( /<[^>]+>/g, ' ' ).replace( /\s+/g, ' ' ).trim();
}

/**
 * Create a normalized slug fragment from heading text.
 *
 * @param {string} text Heading text.
 * @return {string} Slug-safe text.
 */
function slugifyHeadingText( text ) {
	return text
		.toLowerCase()
		.normalize( 'NFKD' )
		.replace( /[\u0300-\u036f]/g, '' )
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /(^-|-$)/g, '' );
}

/**
 * Flatten all core heading blocks in document order.
 *
 * @param {Array} blocks Parsed editor blocks.
 * @param {Array} result Running accumulator.
 * @return {Array} Heading blocks.
 */
export function getAllHeadingBlocks( blocks = [], result = [] ) {
	blocks.forEach( ( block ) => {
		if ( block.name === 'core/heading' ) {
			result.push( block );
		}

		if ( block.innerBlocks?.length ) {
			getAllHeadingBlocks( block.innerBlocks, result );
		}
	} );

	return result;
}

/**
 * Build a nested hierarchy from a flat heading list.
 *
 * @param {Array} headings Flat heading block list.
 * @return {Array} Nested heading tree.
 */
export function getHeadingsHierarchy( headings = [] ) {
	const hierarchy = [];
	const stack = [];

	headings.forEach( ( heading ) => {
		const node = {
			...heading,
			children: [],
			level: heading.attributes.level || 2,
			textContent: getHeadingText( heading.attributes.content ),
		};

		while ( stack.length && stack[ stack.length - 1 ].level >= node.level ) {
			stack.pop();
		}

		if ( stack.length ) {
			stack[ stack.length - 1 ].children.push( node );
		} else {
			hierarchy.push( node );
		}

		stack.push( node );
	} );

	return hierarchy;
}

/**
 * Create unique heading slugs for included headings.
 *
 * @param {Array} headings Flat heading block list.
 * @return {Object<string, string>} Map of client IDs to slugs.
 */
export function getHeadingSlugMap( headings = [] ) {
	const counts = {};
	const slugMap = {};

	headings.forEach( ( heading ) => {
		const { clientId, attributes } = heading;
		const { excludeToc } = attributes;
		const textContent = getHeadingText( attributes.content );

		if ( excludeToc || ! textContent ) {
			slugMap[ clientId ] = '';
			return;
		}

		const baseSlug = slugifyHeadingText( textContent ) || 'heading';
		const occurrence = ( counts[ baseSlug ] || 0 ) + 1;

		counts[ baseSlug ] = occurrence;
		slugMap[ clientId ] =
			1 === occurrence ? baseSlug : `${ baseSlug }-${ occurrence }`;
	} );

	return slugMap;
}

export function getHeadingSaveProps( props = {}, attributes = {} ) {
	if ( attributes.excludeToc || ! attributes.tocSlug ) {
		return props;
	}

	return {
		...props,
		id: attributes.tocSlug,
		className: props.className
			? `${ props.className } ${ HEADING_CLASS_NAME }`
			: HEADING_CLASS_NAME,
	};
}
