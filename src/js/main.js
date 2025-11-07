/**
 * Let's destroy the DOM for no reason except that we can
 * SCROLL SCROLL SCROLL
 */
class App {
    constructor () {
        this.startX;
        this.startY;
        this.scrollLeft;
        this.arrowStep = 100;
        this.spaceStep = window.innerWidth * 0.8; // 80% of viewport width for space bar
        this.batteryLevel = document.getElementById( 'battery-level' );
        this.location = document.getElementById( 'location' );
        this.targetScrollLeft = 0;
        this.currentScrollLeft = 0;
        this.scrollVelocity = 0;
        this.isScrolling = false;
        this.bindEvents();
        this.setHeight();
        this.logStuff();
        // this.logSize();
        // this.fetchLocalData();
    }
    bindEvents () {
        document.addEventListener( 'touchstart', this.handleTouchScrollStart.bind( this ), { passive: true } );
        document.addEventListener( 'touchmove', this.handleTouchScrollMove.bind( this ),  { passive: false } );
        document.addEventListener( 'keydown', this.handleKeyScroll.bind( this ) );
        window.addEventListener( 'wheel', this.handleWheelScroll.bind( this ), { passive: false } );
    }
    setHeight () {
        if ( window.matchMedia( '(pointer: coarse)' ).matches) {
            document.getElementById( 'container' ).style.height = window.innerHeight + 'px';
        }
    }
    logStuff () {
        let snowmen = Array(10).join("☃");
        let styles = 'color: #fff; text-shadow: 0px -1px 4px white, 0px -2px 10px yellow, 0px -10px 20px #ff8000, 0px -18px 40px red; font: 80px "Comic Sans";';
        console.log( `%c ${snowmen}`, styles );
        console.log( `%c Snow glad to see you`, styles );
        console.log( `%c ${snowmen}`, styles );
    }
    logSize () {
        if ( window.location.hash === '#size' ) {
            const dimensionsDiv = document.createElement( 'div' );
        
            // Style the display
            Object.assign( dimensionsDiv.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                fontFamily: 'monospace',
                fontSize: '14px',
                padding: '10px',
                borderRadius: '5px',
                zIndex: '9999'
            });
        
            document.body.appendChild( dimensionsDiv );
            const width = window.innerWidth;
            const height = window.innerHeight;
            dimensionsDiv.textContent = `Window: ${width}px × ${height}px`;
        }
    }
    handleTouchScrollStart ( event ) {
        this.startX = event.touches[0].clientX;
        this.startY = event.touches[0].clientY;
    }
    handleTouchScrollMove ( touchEvent ) {
        touchEvent.preventDefault();

        let diffX = Math.abs( this.startX - touchEvent.touches[0].clientX );
        let diffY = Math.abs( this.startY - touchEvent.touches[0].clientY );
        let thresholdPixels = 10;
        let scrollOffset = .5;

        if ( diffX > thresholdPixels || diffY > thresholdPixels ) {
            if ( diffX > diffY ) {
                window.scrollBy( {
                    left: ( this.startX - touchEvent.touches[0].clientX ) * scrollOffset,
                    behavior: 'auto'
                } );
            } else {
                window.scrollBy( {
                    left: ( this.startY - touchEvent.touches[0].clientY ) * scrollOffset,
                    behavior: 'auto'
                } );
            }
        }
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

        // Accumulate scroll velocity
        this.scrollVelocity += scrollAmount;

        if ( !this.isScrolling ) {
            this.isScrolling = true;
            this.targetScrollLeft = window.scrollX;
            this.smoothScroll();
        }
    }
    smoothScroll () {
        // Easing factor (0.1 = slower/smoother, 0.3 = faster/snappier)
        const easing = 0.15;

        // Apply easing to velocity (friction)
        this.scrollVelocity *= 0.9;
        this.targetScrollLeft += this.scrollVelocity;

        // Calculate difference
        const diff = this.targetScrollLeft - window.scrollX;

        // If still moving significantly, keep scrolling
        if ( Math.abs( diff ) > 0.5 || Math.abs( this.scrollVelocity ) > 0.5 ) {
            window.scrollBy( diff * easing, 0 );
            requestAnimationFrame( () => this.smoothScroll() );
        } else {
            // Reset when done
            this.isScrolling = false;
            this.targetScrollLeft = window.scrollX;
            this.scrollVelocity = 0;
        }
    }
    async fetchLocalData () {
        try {
          const response = await fetch(
            "https://us-central1-projects-342417.cloudfunctions.net/battery"
          );
          if ( ! response.ok ) {
            throw new Error(
              "Network response was not ok " + response.statusText
            );
          }
          const data = await response.json();
          // Update battery level
          this.batteryLevel.textContent = `Battery: ${data.batteryLevel}%`;
          // Update location
          this.location.textContent = `Location: ${data.location}`;
        } catch ( error ) {
          console.error( "There was a problem with the fetch operation:", error );
          this.batteryLevel.innerHTML = "";
          this.location.innerHTML = "";
        }
    }
}

// Initialize the app
document.addEventListener( 'DOMContentLoaded', () => {
    new App();
} );