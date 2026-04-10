/**
 * @jest-environment jsdom
 */

import {
	getAllHeadingBlocks,
	getHeadingSaveProps,
	getHeadingSlugMap,
	getHeadingText,
	getHeadingsHierarchy,
} from '../../src/plugin/utils';

describe( 'TOC heading utilities', () => {
	it( 'extracts plain text from heading HTML', () => {
		expect( getHeadingText( '<strong>Hello</strong> <em>world</em>' ) ).toBe(
			'Hello world',
		);
	} );

	it( 'collects nested heading blocks in document order', () => {
		const blocks = [
			{
				name: 'core/group',
				innerBlocks: [
					{
						clientId: 'heading-1',
						name: 'core/heading',
						attributes: {
							content: 'Heading One',
							level: 2,
						},
						innerBlocks: [],
					},
				],
			},
			{
				clientId: 'heading-2',
				name: 'core/heading',
				attributes: {
					content: 'Heading Two',
					level: 3,
				},
				innerBlocks: [],
			},
		];

		expect( getAllHeadingBlocks( blocks ).map( ( block ) => block.clientId ) ).toEqual(
			[ 'heading-1', 'heading-2' ],
		);
	} );

	it( 'creates a nested hierarchy from heading levels', () => {
		const hierarchy = getHeadingsHierarchy( [
			{
				clientId: 'heading-1',
				attributes: {
					content: 'Heading One',
					level: 2,
				},
			},
			{
				clientId: 'heading-2',
				attributes: {
					content: 'Heading Two',
					level: 3,
				},
			},
			{
				clientId: 'heading-3',
				attributes: {
					content: 'Heading Three',
					level: 2,
				},
			},
		] );

		expect( hierarchy ).toHaveLength( 2 );
		expect( hierarchy[ 0 ].children ).toHaveLength( 1 );
		expect( hierarchy[ 0 ].children[ 0 ].clientId ).toBe( 'heading-2' );
	} );

	it( 'generates unique slugs and skips excluded headings', () => {
		const slugMap = getHeadingSlugMap( [
			{
				clientId: 'heading-1',
				attributes: {
					content: 'Overview',
					excludeToc: false,
				},
			},
			{
				clientId: 'heading-2',
				attributes: {
					content: 'Overview',
					excludeToc: false,
				},
			},
			{
				clientId: 'heading-3',
				attributes: {
					content: 'Hidden',
					excludeToc: true,
				},
			},
		] );

		expect( slugMap ).toEqual( {
			'heading-1': 'overview',
			'heading-2': 'overview-2',
			'heading-3': '',
		} );
	} );

	it( 'adds save props only when a heading is included in the toc', () => {
		expect(
			getHeadingSaveProps(
				{
					className: 'wp-block-heading',
				},
				{
					excludeToc: false,
					tocSlug: 'overview',
				},
			),
		).toEqual( {
			className: 'wp-block-heading is-simple-wp-toc-heading',
			id: 'overview',
		} );

		expect(
			getHeadingSaveProps(
				{
					className: 'wp-block-heading',
				},
				{
					excludeToc: true,
					tocSlug: 'overview',
				},
			),
		).toEqual( {
			className: 'wp-block-heading',
		} );
	} );
} );
