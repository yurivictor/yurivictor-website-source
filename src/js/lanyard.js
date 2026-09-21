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
 * The canvas spans the whole section (~480x853), not just the media slot, so
 * that a card dragged downward stays drawn — see _portfolio.scss. Vertical FOV
 * maps to canvas height, so that taller canvas alone renders the card larger;
 * z then sets how much larger. At fov 20 the visible world height is
 * 2 * z * tan( 10 deg ), giving 853 / ( 2 * 15.4 * tan( 10 deg ) ) = 157
 * pixels per world unit, twice the 78 it was before.
 *
 * Camera y is 0 on purpose, and vertical framing is done with ANCHOR_Y
 * instead. R3F's default camera does lookAt( 0, 0, 0 ), so the world origin is
 * always at the centre of the canvas and moving the camera up or down only
 * tilts the view — sweeping y from +3 to -3 moves the card by about ten
 * pixels. Composing vertically means moving the rig, not the camera.
 *
 * ANCHOR_Y is measured rather than derived, because where the card comes to
 * rest is a physics result: at the default 4 the card hung ~160px too low and
 * overlapped the access form, so the rig is raised by ~1 world unit. The card
 * now occupies roughly the top 180-530px of the 853px section, and the band
 * runs off the top edge as though the lanyard continues past the frame.
 *
 * metalness is well below upstream's 0.8. That value reads as sheen on their
 * dark demo card, but the Apple badge is 98% white and goes grey under it.
 */
const CAMERA = [ 0, 0, 15.4 ];
const FOV = 20;
const ANCHOR_Y = 5;
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
            anchorY: ANCHOR_Y,
            cardMetalness: CARD_METALNESS,
            // The vendored atlas has reactbits.dev printed on the back face.
            blankBack: true,
            // lanyard.png is their black band with the atom logo tiled along
            // it; a flat colour drops the map entirely.
            lanyardColor: '#000',
            // Skip R3F's default ACES tone mapping, which caps white at
            // ~236/255 and leaves the badge looking greyed out on a #fafafa
            // page.
            flat: true,
            onDragChange
        } )
    );
}

if ( document.readyState === 'loading' ) {
    document.addEventListener( 'DOMContentLoaded', mount );
} else {
    mount();
}
