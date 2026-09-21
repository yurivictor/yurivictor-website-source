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
    fit: q.get( 'fit' ) || 'cover',
    blankBack: q.get( 'back' ) !== 'reactbits',
    band: q.get( 'band' ) === 'atom' ? null : ( q.get( 'band' ) || '#000' ),
    flat: q.get( 'tone' ) !== 'aces',
    anchor: num( 'anchor', 4 )
};

/**
 * R3F's default camera does lookAt( 0, 0, 0 ), so the world origin is always
 * at the centre of the canvas and the camera's y only tilts the view — it
 * cannot pan the framing. Sweeping y from +3 to -3 moves the card about ten
 * pixels. Use `anchor` to compose vertically; it moves the rig instead.
 *
 * What y and z do change is scale, via the visible world height at the card:
 * 2 * z * tan( fov / 2 ), spread over the canvas height in pixels.
 */
const pxPerUnit = () => {
    const stage = document.querySelector( '#stage' );
    const h = stage ? stage.getBoundingClientRect().height : window.innerHeight;
    return h / ( 2 * settings.z * Math.tan( ( settings.fov / 2 ) * Math.PI / 180 ) );
};

const readout = document.querySelector( '#readout' );
if ( readout ) {
    readout.textContent = [
        `position [ ${settings.x}, ${settings.y}, ${settings.z} ]  fov ${settings.fov}`,
        `metalness ${settings.metalness}  roughness ${settings.roughness}`,
        `lanyardWidth ${settings.width}  imageFit ${settings.fit}`,
        `blankBack ${settings.blankBack}  band ${settings.band || 'atom texture'}`,
        `anchorY ${settings.anchor}`,
        `flat ${settings.flat} ${settings.flat ? '(no tone mapping)' : '(ACES)'}`,
        ``,
        `scale at this z/fov: ${pxPerUnit().toFixed( 0 )} px per world unit`,
        `camera y only tilts — use anchor to move the card vertically`
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
        imageFit: settings.fit,
        blankBack: settings.blankBack,
        lanyardColor: settings.band,
        flat: settings.flat,
        anchorY: settings.anchor
    } )
);
