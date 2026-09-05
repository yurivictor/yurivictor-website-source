import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import Lanyard from './lanyard/Lanyard.jsx';

/**
 * Dev-only tuning harness for /lanyard-test.html. Not a build entry — Vite
 * only bundles js/main.js and js/lanyard.js, so this never ships. It exists
 * because camera framing and material values can't be reasoned about without
 * looking at them, and editing a file per guess is slow.
 *
 * Every knob is a URL query param, so iterating is just editing the address
 * bar. Once the numbers look right, copy them into src/js/lanyard.js.
 *
 * The page also deliberately loads *without* main.js, which isolates the
 * component from the host page's scroll handlers and layout.
 */

const q = new URLSearchParams( location.search );
const num = ( key, fallback ) => {
    const raw = q.get( key );
    const parsed = Number.parseFloat( raw );
    return raw !== null && Number.isFinite( parsed ) ? parsed : fallback;
};

const settings = {
    x: num( 'x', 0 ),
    y: num( 'y', 0 ),
    z: num( 'z', 30 ),
    fov: num( 'fov', 20 ),
    metalness: num( 'metalness', 0.15 ),
    roughness: num( 'roughness', 0.9 ),
    width: num( 'width', 1 ),
    fit: q.get( 'fit' ) || 'cover'
};

/**
 * The band's fixed anchor sits at world y = 4. Vertical FOV means the visible
 * half-height at the card's depth is z * tan( fov / 2 ), independent of the
 * canvas pixel height — so this stays stable as the viewport resizes.
 *
 * To pin the anchor to the top edge of the canvas:
 *   cameraY = 4 - z * tan( fov / 2 )
 */
const anchorTopY = z => 4 - z * Math.tan( ( settings.fov / 2 ) * Math.PI / 180 );

const readout = document.querySelector( '#readout' );
if ( readout ) {
    readout.textContent = [
        `position [ ${settings.x}, ${settings.y}, ${settings.z} ]  fov ${settings.fov}`,
        `metalness ${settings.metalness}  roughness ${settings.roughness}`,
        `lanyardWidth ${settings.width}  imageFit ${settings.fit}`,
        ``,
        `y to pin the band to the top edge at this z/fov: ${anchorTopY( settings.z ).toFixed( 2 )}`
    ].join( '\n' );
}

createRoot( document.querySelector( '#apple-lanyard' ) ).render(
    createElement( Lanyard, {
        frontImage: '/images/apple_badge-cutout.png',
        position: [ settings.x, settings.y, settings.z ],
        fov: settings.fov,
        cardMetalness: settings.metalness,
        cardRoughness: settings.roughness,
        lanyardWidth: settings.width,
        imageFit: settings.fit
    } )
);
