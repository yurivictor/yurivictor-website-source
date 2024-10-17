/**
 * Let's destroy the DOM for no reason except that we can
 * SCROLL SCROLL SCROLL
 */
class App {
    constructor () {
        this.endY
        this.startY;
        this.scrollLeft;
        this.arrowStep = 100;
        this.spaceStep = window.innerWidth * 0.8; // 80% of viewport width for space bar
        this.bindEvents();
    }
    bindEvents () {
        document.addEventListener( 'touchstart', this.handleTouchScrollStart.bind( this ), { passive: true } );
        document.addEventListener( 'touchmove', this.handleTouchScrollMove.bind( this ),  { passive: false } );
        document.addEventListener( 'keydown', this.handleKeyScroll.bind( this ) );
        window.addEventListener( 'wheel', this.handleWheelScroll.bind( this ), { passive: false } );
    }
    handleTouchScrollStart ( event ) {
        this.startY = event.touches[0].pageY;
    }
    handleTouchScrollMove ( touchEvent ) {
        touchEvent.preventDefault();
        this.endY = touchEvent.touches[0].pageY;
        const scrollAmount = ( this.startY - this.endY ) * .5;
        window.scrollBy( {
            left: scrollAmount,
            behavior: 'auto'
        } );
    }
    handleKeyScroll ( event ) {
        const spaceKey = event.key == " " || event.code == "Space" || event.keyCode == 32;
        if ( spaceKey ) {
            event.preventDefault();
            if ( event.shiftKey ) {
                // Shift + Space: scroll left
                window.scrollBy( {
                    left: -this.spaceStep,
                    behavior: 'smooth'
                } );
            } else {
                // Space alone: scroll right
                window.scrollBy( {
                    left: this.spaceStep,
                    behavior: 'smooth'
                } );
            }
            return;
        }

        switch ( event.key ) {
            case 'ArrowUp':
            case 'ArrowLeft':
                event.preventDefault();
                if ( event.metaKey ) {
                    window.scrollTo( {
                        left: 0,
                        behavior: 'smooth'
                    } );
                } else {
                    window.scrollBy( {
                        left: -this.arrowStep,
                        behavior: 'smooth'
                    } );
                }
                break;
            case 'ArrowDown':
            case 'ArrowRight':
                event.preventDefault();
                // Scroll right
                if ( event.metaKey ) {
                    window.scrollTo( {
                        left: document.body.scrollWidth,
                        behavior: 'smooth'
                    } );
                } else {
                    window.scrollBy( {
                        left: this.arrowStep,
                        behavior: 'smooth'
                    } );
                }
                break;
        }
    }
    handleWheelScroll ( event ) {
        event.preventDefault();
        const scrollAmount = Math.abs( event.deltaX ) > Math.abs( event.deltaY ) ? event.deltaX : event.deltaY;

        window.scrollBy( {
            left: scrollAmount,
            behavior: 'auto'
        } );
    }
}

// Initialize the app
document.addEventListener( 'DOMContentLoaded', () => {
    new App();
} );