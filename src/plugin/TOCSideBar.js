import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { PanelBody, PanelRow, CheckboxControl } from '@wordpress/components';

import { getAllHeadingBlocks, getHeadingsHierarchy } from './utils';

function HeadingList( { items, onToggle } ) {
	return (
		<ul style={ { marginTop: '10px', paddingLeft: '10px' } }>
			{ items.map( ( heading ) => (
				<li key={ heading.clientId } style={ { padding: '5px' } }>
					<CheckboxControl
						checked={ ! heading.attributes.excludeToc }
						label={ heading.textContent }
						onChange={ ( value ) => onToggle( heading, ! value ) }
					/>
					{ heading.children.length > 0 && (
						<HeadingList items={ heading.children } onToggle={ onToggle } />
					) }
				</li>
			) ) }
		</ul>
	);
}

export default function TOCSideBar() {
	const headings = useSelect( ( select ) => {
		return getHeadingsHierarchy(
			getAllHeadingBlocks( select( 'core/block-editor' ).getBlocks() ),
		);
	}, [] );
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const toggleHeading = ( heading, status ) => {
		updateBlockAttributes( heading.clientId, {
			excludeToc: status,
		} );

		if ( heading.children.length > 0 ) {
			heading.children.forEach( ( child ) => {
				toggleHeading( child, status );
			} );
		}
	};

	if ( 0 === headings.length ) {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Table of Contents', 'simple-wp-toc' ) }
				initialOpen={ true }
			>
				<PanelRow>
					<div style={ { marginLeft: '-10px' } }>
						<HeadingList items={ headings } onToggle={ toggleHeading } />
					</div>
				</PanelRow>
			</PanelBody>
		</InspectorControls>
	);
}
