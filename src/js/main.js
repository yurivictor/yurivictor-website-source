class SunOrb {
    constructor ( containerId ) {
        this.container = document.getElementById( containerId );
        if ( !this.container || typeof THREE === 'undefined' ) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000 );
        this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        this.renderer.setClearColor( 0x000000, 0 );
        this.renderer.setSize( this.container.offsetWidth, this.container.offsetHeight );
        this.container.appendChild( this.renderer.domElement );

        this.createSun();
        this.addLighting();
        this.updateCamera( this.container.offsetWidth, this.container.offsetHeight );
        this.setupResizeHandler();
        this.animate();
    }

    createSun () {
        const geometry = new THREE.SphereGeometry( 1, 64, 64 );

        const fragmentShader = `
            uniform float time;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUv;

            float noise( vec2 p ) {
                return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
            }

            void main() {
                vec2 center = vec2( 0.5, 0.5 );
                float dist = length( vUv - center );

                float gradient = smoothstep( 0.5, 0.0, dist );

                float grain = noise( vUv * 600.0 + time * 0.05 );
                grain = ( grain - 0.5 ) * 0.15;

                float pulse = 0.02 * sin( time * 0.5 );
                gradient = gradient + pulse;

                vec3 centerColor = vec3( 205.0/255.0, 170.0/255.0,  95.0/255.0 );
                vec3 midColor    = vec3( 220.0/255.0, 190.0/255.0, 125.0/255.0 );
                vec3 edgeColor   = vec3( 200.0/255.0, 165.0/255.0, 100.0/255.0 );

                vec3 finalColor;
                if ( gradient > 0.3 ) {
                    finalColor = mix( midColor, centerColor, ( gradient - 0.3 ) / 0.7 );
                } else {
                    finalColor = mix( edgeColor, midColor, gradient / 0.3 );
                }

                finalColor += grain;

                vec3 viewDirection = normalize( vPosition );
                float fresnel = abs( dot( viewDirection, vNormal ) );
                float alpha = smoothstep( 0.0, 0.4, fresnel ) * smoothstep( 0.55, 0.0, dist );

                gl_FragColor = vec4( finalColor, alpha );
            }
        `;

        const vertexShader = `
            uniform float time;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vUv = uv;
                vNormal = normalize( normalMatrix * normal );
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                vPosition = mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const material = new THREE.ShaderMaterial( {
            uniforms: {
                time: { value: 0 }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        } );

        this.sun = new THREE.Mesh( geometry, material );
        this.scene.add( this.sun );
    }

    addLighting () {
        this.scene.add( new THREE.AmbientLight( 0x404040 ) );
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
        directionalLight.position.set( 1, 1, 1 );
        this.scene.add( directionalLight );
    }

    updateCamera ( w, h ) {
        const aspect = w / h;
        // Push camera back on narrow containers so sphere stays within bounds.
        // Derived from: sphere diameter (2) must fit horizontal FOV at distance z.
        // z >= 1 / ( tan( FOV/2 ) * aspect ), with a small margin.
        const minZ = 1.15 / ( Math.tan( ( 75 / 2 ) * ( Math.PI / 180 ) ) * aspect );
        this.camera.position.z = Math.max( 3, minZ );
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    setupResizeHandler () {
        window.addEventListener( 'resize', () => {
            const w = this.container.offsetWidth;
            const h = this.container.offsetHeight;
            this.updateCamera( w, h );
            this.renderer.setSize( w, h );
        } );
    }

    animate () {
        requestAnimationFrame( () => this.animate() );
        this.sun.rotation.y += 0.005;
        this.sun.rotation.x += 0.002;
        this.sun.material.uniforms.time.value = performance.now() * 0.001;
        this.renderer.render( this.scene, this.camera );
    }
}

/**
 * Let's destroy the DOM for no reason except that we can
 * SCROLL SCROLL SCROLL
 */
class App {
    constructor () {
        this.startX;
        this.startY;
        this.startTime;
        this.scrollLeft;
        this.arrowStep = 100;
        this.spaceStep = window.innerWidth * 0.8; // 80% of viewport width for space bar
        this.batteryLevel = document.getElementById( 'battery-level' );
        this.location = document.getElementById( 'location' );
        this.targetScrollLeft = 0;
        this.currentScrollLeft = 0;
        this.scrollVelocity = 0;
        this.isScrolling = false;
        this.easing = 0.15;
        this.velocityFriction = 0.9;
        this.wheelMultiplier = 0.3;
        this.scrollOffset = 0.5;
        this.tapThreshold = 10; // pixels
        this.tapTimeThreshold = 300; // milliseconds
        this.isTouchDevice = window.matchMedia( '(pointer: coarse)' ).matches;
        this.hasScrolled = false; // Track if user scrolled vs tapped
        this.bindEvents();
        this.setHeight();
        this.logStuff();
        // this.createScrollSettings();
        // this.logSize();
        // this.fetchLocalData();
    }
    bindEvents () {
        document.addEventListener( 'touchstart', this.handleTouchScrollStart.bind( this ), { passive: true } );
        if ( this.isTouchDevice ) {
            // Touch devices: tap-only scrolling
            document.addEventListener( 'touchmove', this.handleTouchScrollToTap.bind( this ), { passive: false } );
            document.addEventListener( 'touchend', this.handleTouchScrollEnd.bind( this ), { passive: true } );
        } else {
            // Non-touch devices: keep drag scrolling
            document.addEventListener( 'touchmove', this.handleTouchScrollMove.bind( this ),  { passive: false } );
        }
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
        this.startTime = Date.now();
        this.hasScrolled = false;
    }
    handleTouchScrollMove ( touchEvent ) {
        touchEvent.preventDefault();

        let diffX = Math.abs( this.startX - touchEvent.touches[0].clientX );
        let diffY = Math.abs( this.startY - touchEvent.touches[0].clientY );
        let thresholdPixels = 10;

        if ( diffX > thresholdPixels || diffY > thresholdPixels ) {
            if ( diffX > diffY ) {
                window.scrollBy( {
                    left: ( this.startX - touchEvent.touches[0].clientX ) * this.scrollOffset,
                    behavior: 'auto'
                } );
            } else {
                window.scrollBy( {
                    left: ( this.startY - touchEvent.touches[0].clientY ) * this.scrollOffset,
                    behavior: 'auto'
                } );
            }
        }
    }
    handleTouchScrollToTap ( touchEvent ) {
        touchEvent.preventDefault();

        const currentX = touchEvent.touches[0].clientX;
        const currentY = touchEvent.touches[0].clientY;
        const diffX = this.startX - currentX;
        const diffY = this.startY - currentY;

        // Check if user has moved beyond tap threshold
        if ( Math.abs( diffX ) > this.tapThreshold || Math.abs( diffY ) > this.tapThreshold ) {
            if ( !this.hasScrolled ) {
                this.hasScrolled = true;

                // Determine scroll direction - use the larger movement
                const scrollAmount = Math.abs( diffX ) > Math.abs( diffY ) ? diffX : diffY;
                const direction = scrollAmount > 0 ? 1 : -1; // positive = forward, negative = back

                // Scroll one viewport width in the detected direction
                window.scrollBy( {
                    left: window.innerWidth * direction,
                    behavior: 'smooth'
                } );
            }
        }
    }
    handleTouchScrollEnd ( event ) {
        // If user already scrolled, don't process tap
        if ( this.hasScrolled ) {
            return;
        }

        const endX = event.changedTouches[0].clientX;
        const endY = event.changedTouches[0].clientY;
        const endTime = Date.now();

        const diffX = Math.abs( this.startX - endX );
        const diffY = Math.abs( this.startY - endY );
        const duration = endTime - this.startTime;

        // Check if it's a tap (minimal movement and quick)
        const isTap = diffX < this.tapThreshold &&
                      diffY < this.tapThreshold &&
                      duration < this.tapTimeThreshold;

        if ( isTap ) {
            // Determine direction based on which side of screen was tapped
            const screenMidpoint = window.innerWidth / 2;
            const direction = endX < screenMidpoint ? -1 : 1; // Left = back, Right = forward

            // Scroll one full viewport width in the determined direction
            window.scrollBy( {
                left: window.innerWidth * direction,
                behavior: 'smooth'
            } );
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
        this.scrollVelocity += scrollAmount * this.wheelMultiplier;

        if ( !this.isScrolling ) {
            this.isScrolling = true;
            this.targetScrollLeft = window.scrollX;
            this.smoothScroll();
        }
    }
    smoothScroll () {
        // Apply easing to velocity (friction)
        this.scrollVelocity *= this.velocityFriction;
        this.targetScrollLeft += this.scrollVelocity;

        // Calculate difference
        const diff = this.targetScrollLeft - window.scrollX;

        // If still moving significantly, keep scrolling
        if ( Math.abs( diff ) > 0.5 || Math.abs( this.scrollVelocity ) > 0.5 ) {
            window.scrollBy( diff * this.easing, 0 );
            requestAnimationFrame( () => this.smoothScroll() );
        } else {
            // Reset when done
            this.isScrolling = false;
            this.targetScrollLeft = window.scrollX;
            this.scrollVelocity = 0;
        }
    }
    createScrollSettings () {
        const panel = document.createElement( 'div' );
        panel.id = 'scroll-settings-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 280px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;

        const title = document.createElement( 'div' );
        title.textContent = 'Scroll Settings';
        title.style.cssText = `
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        `;
        panel.appendChild( title );

        const settings = [
            { name: 'arrowStep', label: 'Arrow Step', min: 10, max: 500, step: 10 },
            { name: 'easing', label: 'Easing', min: 0.01, max: 0.5, step: 0.01 },
            { name: 'velocityFriction', label: 'Velocity Friction', min: 0.7, max: 0.99, step: 0.01 },
            { name: 'scrollOffset', label: 'Touch Offset', min: 0.1, max: 2, step: 0.1 },
            { name: 'tapThreshold', label: 'Tap Threshold (px)', min: 5, max: 50, step: 5 },
            { name: 'tapTimeThreshold', label: 'Tap Time (ms)', min: 100, max: 1000, step: 50 }
        ];

        settings.forEach( setting => {
            const container = document.createElement( 'div' );
            container.style.cssText = 'margin-bottom: 15px;';

            const labelRow = document.createElement( 'div' );
            labelRow.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 5px;';

            const label = document.createElement( 'label' );
            label.textContent = setting.label;
            label.style.cssText = 'color: #aaa;';

            const value = document.createElement( 'span' );
            value.textContent = this[setting.name];
            value.style.cssText = 'color: #0f0; font-weight: bold;';

            labelRow.appendChild( label );
            labelRow.appendChild( value );

            const slider = document.createElement( 'input' );
            slider.type = 'range';
            slider.min = setting.min;
            slider.max = setting.max;
            slider.step = setting.step;
            slider.value = this[setting.name];
            slider.style.cssText = 'width: 100%; cursor: pointer;';

            slider.addEventListener( 'input', ( e ) => {
                const newValue = parseFloat( e.target.value );
                this[setting.name] = newValue;
                value.textContent = newValue;
            } );

            container.appendChild( labelRow );
            container.appendChild( slider );
            panel.appendChild( container );
        } );

        const toggleButton = document.createElement( 'button' );
        toggleButton.textContent = 'Hide';
        toggleButton.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-top: 10px;
            background: #333;
            color: white;
            border: 1px solid #555;
            border-radius: 4px;
            cursor: pointer;
            font-family: monospace;
        `;

        let isCollapsed = false;
        const content = panel.querySelector( 'div' ).parentElement;

        toggleButton.addEventListener( 'click', () => {
            isCollapsed = !isCollapsed;
            if ( isCollapsed ) {
                Array.from( panel.children ).forEach( ( child, index ) => {
                    if ( index > 0 && child !== toggleButton ) {
                        child.style.display = 'none';
                    }
                } );
                toggleButton.textContent = 'Show';
                panel.style.minWidth = '120px';
            } else {
                Array.from( panel.children ).forEach( child => {
                    child.style.display = '';
                } );
                toggleButton.textContent = 'Hide';
                panel.style.minWidth = '280px';
            }
        } );

        panel.appendChild( toggleButton );
        document.body.appendChild( panel );

        // Prevent panel from capturing keyboard events that should go to the main app
        panel.addEventListener( 'keydown', ( e ) => {
            // Allow arrow keys, space, etc to pass through to the main app
            if ( e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
                 e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                 e.key === ' ' || e.key === 'Space' ) {
                e.preventDefault();
                e.stopPropagation();
                // Manually trigger the main keyboard handler
                this.handleKeyScroll( e );
            }
        } );

        // Keyboard shortcut to toggle panel visibility
        document.addEventListener( 'keydown', ( e ) => {
            if ( e.key === 's' && e.shiftKey && e.metaKey ) {
                e.preventDefault();
                panel.style.display = panel.style.display === 'none' ? '' : 'none';
            }
        } );
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
    new SunOrb( 'header-sun' );
    new App();
} );