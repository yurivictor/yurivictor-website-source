import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import Lanyard from './lanyard/Lanyard.jsx';

/**
 * React island for the Apple section's badge. The rest of the page stays
 * vanilla — main.js runs independently and knows nothing about this.
 *
 * Deliberately written without JSX so the file extension stays .js and
 * index.html can reference /js/lanyard.js unchanged in both dev and prod.
 */

const MOUNT = '#apple-lanyard';
const BADGE = '/images/apple_badge-cutout.png';

/**
 * Tune these against /lanyard-test.html, which exposes all of them as query
 * params. Don't guess by editing this file.
 *
 * The band's fixed anchor sits at world y = 4. Because FOV is vertical, the
 * visible half-height is z * tan( fov / 2 ) regardless of how tall the canvas
 * is in pixels, so pinning the anchor to the top edge is stable across
 * viewport sizes:
 *
 *   cameraY = 4 - z * tan( fov / 2 )
 *           = 4 - 20 * tan( 10° )
 *           = 0.47
 *
 * metalness is well below upstream's 0.8. That value reads as sheen on their
 * dark demo card, but the Apple badge is 98% white and goes grey under it.
 */
const CAMERA = [ 0, 0.47, 20 ];
const FOV = 20;
const CARD_METALNESS = 0.15;

/**
 * The page navigates horizontally off document-level touch handlers in App:
 * handleTouchScrollToTap jumps a full viewport once a touch moves past 10px,
 * and handleTouchScrollEnd treats a short tap as a page jump. Both would fire
 * while you're trying to swing the badge.
 *
 * Isolation is deliberately selective. Only gestures that actually grab the
 * card are swallowed — touching the empty space around it still navigates, so
 * the lanyard doesn't become a dead zone on a site where tapping is how you
 * move between sections.
 *
 * Two details make this work:
 *  - Touch events stay retargeted to the element the gesture started on, so a
 *    listener here sees the whole gesture and never one that began elsewhere.
 *  - The grabbed flag is cleared on the next touchstart rather than on
 *    release, because pointerup (which ends the drag) fires before touchend
 *    (which would otherwise be read as a navigating tap).
 */
function isolateTouchWhileGrabbed ( el ) {
    let grabbed = false;

    el.addEventListener( 'touchstart', () => {
        grabbed = false;
    }, { passive: true } );

    [ 'touchmove', 'touchend', 'touchcancel' ].forEach( type => {
        el.addEventListener( type, event => {
            if ( grabbed ) event.stopPropagation();
        } );
    } );

    return isGrabbed => {
        if ( isGrabbed ) grabbed = true;
    };
}

function mount () {
    const host = document.querySelector( MOUNT );
    if ( !host ) return;

    const onDragChange = isolateTouchWhileGrabbed( host );

    createRoot( host ).render(
        createElement( Lanyard, {
            frontImage: BADGE,
            position: CAMERA,
            fov: FOV,
            cardMetalness: CARD_METALNESS,
            onDragChange
        } )
    );
}

if ( document.readyState === 'loading' ) {
    document.addEventListener( 'DOMContentLoaded', mount );
} else {
    mount();
}
