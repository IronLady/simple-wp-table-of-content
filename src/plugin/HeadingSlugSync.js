import { useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

import { getAllHeadingBlocks, getHeadingSlugMap } from './utils';

/**
 * Keep generated TOC slugs synchronized with the current heading list.
 *
 * @return {null} No UI.
 */
export default function HeadingSlugSync() {
	const headings = useSelect( ( select ) => {
		return getAllHeadingBlocks( select( 'core/block-editor' ).getBlocks() );
	}, [] );
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	useEffect( () => {
		const slugMap = getHeadingSlugMap( headings );

		headings.forEach( ( heading ) => {
			const nextSlug = slugMap[ heading.clientId ] || '';
			const currentSlug = heading.attributes.tocSlug || '';

			if ( currentSlug !== nextSlug ) {
				updateBlockAttributes( heading.clientId, {
					tocSlug: nextSlug,
				} );
			}
		} );
	}, [ headings, updateBlockAttributes ] );

	return null;
}
