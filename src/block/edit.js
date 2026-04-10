import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Disabled } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import HeadingSlugSync from '../plugin/HeadingSlugSync';
import TOCSideBar from '../plugin/TOCSideBar';
import { getAllHeadingBlocks, getHeadingsHierarchy } from '../plugin/utils';

function getBlocksByName( blocks, blockName, result = [] ) {
	blocks.forEach( ( block ) => {
		if ( block.name === blockName ) {
			result.push( block );
		}

		if ( block.innerBlocks?.length ) {
			getBlocksByName( block.innerBlocks, blockName, result );
		}
	} );

	return result;
}

function TOCPreviewList( { items } ) {
	return (
		<ul className="simple-wp-toc__list">
			{ items.map( ( item ) => (
				<li key={ item.clientId } className="simple-wp-toc__item">
					<a className="simple-wp-toc__link" href={ `#${ item.attributes.tocSlug }` }>
						{ item.textContent }
					</a>
					{ item.children.length > 0 && <TOCPreviewList items={ item.children } /> }
				</li>
			) ) }
		</ul>
	);
}

export default function Edit( { clientId } ) {
	const headings = useSelect( ( select ) => {
		const blocks = getAllHeadingBlocks( select( 'core/block-editor' ).getBlocks() );
		const includedHeadings = blocks.filter( ( block ) => {
			return ! block.attributes.excludeToc && block.attributes.tocSlug;
		} );

		return getHeadingsHierarchy( includedHeadings );
	}, [] );
	const shouldRunSync = useSelect(
		( select ) => {
			const tocBlocks = getBlocksByName(
				select( 'core/block-editor' ).getBlocks(),
				'simple-wp-toc/table-of-contents',
			);

			return tocBlocks[ 0 ]?.clientId === clientId;
		},
		[ clientId ],
	);
	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			{ shouldRunSync && <HeadingSlugSync /> }
			<TOCSideBar />
			<Placeholder
				icon="list-view"
				label={ __( 'Table of Contents', 'simple-wp-toc' ) }
				instructions={ __(
					'This block renders a table of contents from included Heading blocks in this post.',
					'simple-wp-toc',
				) }
			>
				<Disabled>
					{ headings.length > 0 ? (
						<TOCPreviewList items={ headings } />
					) : (
						<p>
							{ __(
								'Add Heading blocks to this post to build the table of contents.',
								'simple-wp-toc',
							) }
						</p>
					) }
				</Disabled>
			</Placeholder>
		</div>
	);
}
