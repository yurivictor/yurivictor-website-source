var e=class{constructor(e){this.container=document.getElementById(e),!(!this.container||typeof THREE>`u`)&&(this.scene=new THREE.Scene,this.camera=new THREE.PerspectiveCamera(75,this.container.offsetWidth/this.container.offsetHeight,.1,1e3),this.renderer=new THREE.WebGLRenderer({antialias:!0,alpha:!0}),this.renderer.setClearColor(0,0),this.renderer.setSize(this.container.offsetWidth,this.container.offsetHeight),this.container.appendChild(this.renderer.domElement),this.createSun(),this.addLighting(),this.updateCamera(this.container.offsetWidth,this.container.offsetHeight),this.setupResizeHandler(),this.animate())}createSun(){let e=new THREE.SphereGeometry(1,64,64),t=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`
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
        `,fragmentShader:`
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
        `,transparent:!0,side:THREE.DoubleSide});this.sun=new THREE.Mesh(e,t),this.scene.add(this.sun)}addLighting(){this.scene.add(new THREE.AmbientLight(4210752));let e=new THREE.DirectionalLight(16777215,.5);e.position.set(1,1,1),this.scene.add(e)}updateCamera(e,t){let n=e/t,r=1.15/(Math.tan(75/2*(Math.PI/180))*n);this.camera.position.z=Math.max(3,r),this.camera.aspect=n,this.camera.updateProjectionMatrix()}setupResizeHandler(){window.addEventListener(`resize`,()=>{let e=this.container.offsetWidth,t=this.container.offsetHeight;this.updateCamera(e,t),this.renderer.setSize(e,t)})}animate(){requestAnimationFrame(()=>this.animate()),this.sun.rotation.y+=.005,this.sun.rotation.x+=.002,this.sun.material.uniforms.time.value=performance.now()*.001,this.renderer.render(this.scene,this.camera)}},t=class{constructor(e){this.container=document.getElementById(e),!(!this.container||typeof THREE>`u`)&&(this.mouseX=0,this.mouseY=0,this.targetMouseX=0,this.targetMouseY=0,this.scene=new THREE.Scene,this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1),this.renderer=new THREE.WebGLRenderer({antialias:!1}),this.renderer.setSize(this.container.offsetWidth,this.container.offsetHeight),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.container.appendChild(this.renderer.domElement),this.createSky(),this.setupResizeHandler(),this.setupMouseHandler(),this.animate())}createSky(){let e=new THREE.PlaneGeometry(2,2);this.material=new THREE.ShaderMaterial({uniforms:{time:{value:0},resolution:{value:new THREE.Vector2(this.container.offsetWidth,this.container.offsetHeight)},mouse:{value:new THREE.Vector2(0,0)}},vertexShader:`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4( position.xy, 0.0, 1.0 );
            }
        `,fragmentShader:`
            uniform float time;
            uniform vec2 resolution;
            uniform vec2 mouse;
            varying vec2 vUv;

            float hash21( vec2 p ) {
                p = fract( p * vec2( 123.34, 456.21 ) );
                p += dot( p, p + 45.32 );
                return fract( p.x * p.y );
            }

            float noise( vec2 p ) {
                vec2 i = floor( p );
                vec2 f = fract( p );
                f = f * f * ( 3.0 - 2.0 * f );
                return mix(
                    mix( hash21( i ),               hash21( i + vec2( 1.0, 0.0 ) ), f.x ),
                    mix( hash21( i + vec2( 0.0, 1.0 ) ), hash21( i + vec2( 1.0, 1.0 ) ), f.x ),
                    f.y
                );
            }

            float fbm( vec2 p ) {
                float v = 0.0;
                float a = 0.5;
                mat2 m = mat2( 1.6, 1.2, -1.2, 1.6 );
                for ( int i = 0; i < 5; i++ ) {
                    v += a * noise( p );
                    p = m * p;
                    a *= 0.5;
                }
                return v;
            }

            float starLayer( vec2 uv, float scale, float probability, float size ) {
                vec2 cell    = floor( uv * scale );
                vec2 cellPos = fract( uv * scale ) - 0.5;
                float rnd = hash21( cell );
                if ( rnd > probability ) return 0.0;
                vec2 offset    = vec2( hash21( cell + 0.3 ) - 0.5, hash21( cell + 0.7 ) - 0.5 ) * 0.6;
                float dist     = length( cellPos - offset );
                float bri      = 0.5 + 0.5 * hash21( cell + 1.5 );
                float twinkle  = 0.75 + 0.25 * sin( time * ( 0.5 + bri * 2.0 ) + rnd * 6.28318 );
                return smoothstep( size, 0.0, dist ) * bri * twinkle;
            }

            void main() {
                float aspect = resolution.x / resolution.y;
                vec2 uv = ( vUv - 0.5 ) * vec2( aspect, 1.0 );

                // Slow sky rotation
                float angle = time * 0.015;
                float c = cos( angle );
                float s = sin( angle );
                uv = vec2( c * uv.x - s * uv.y, s * uv.x + c * uv.y );

                // Mouse parallax
                uv += mouse * 0.04;

                // === Milky Way ===
                float bandAngle = 1.1;
                float bandDist  = abs( uv.x * sin( bandAngle ) - uv.y * cos( bandAngle ) );
                float bandMask  = exp( -bandDist * bandDist * 3.5 );

                float nebula  = fbm( uv * 1.8 + vec2(  0.5,  0.3 ) ) * bandMask;
                float nebula2 = fbm( uv * 3.5 + vec2( -0.2,  0.8 ) ) * bandMask * 0.6;
                float nebulaTotal = nebula + nebula2;

                vec3 nebulaColor = mix(
                    vec3( 0.0,  0.02, 0.10 ),
                    vec3( 0.2,  0.25, 0.55 ),
                    clamp( nebulaTotal * 1.2, 0.0, 1.0 )
                );
                // Warm galactic core tint
                nebulaColor += vec3( 0.15, 0.10, 0.03 ) * smoothstep( 0.35, 0.75, nebula );

                // === Stars ===
                float mwBoost = 1.0 + bandMask * 1.6;

                float starBri = 0.0;
                starBri += starLayer( uv,  12.0, 0.04 * mwBoost, 0.045 );
                starBri += starLayer( uv,  25.0, 0.07 * mwBoost, 0.028 ) * 0.75;
                starBri += starLayer( uv,  55.0, 0.10 * mwBoost, 0.016 ) * 0.45;
                starBri += starLayer( uv, 110.0, 0.14 * mwBoost, 0.009 ) * 0.25;

                vec3 starColor = vec3( 0.85, 0.92, 1.0 ) * starBri;

                // Warm (orange) and cool (blue) colored stars
                starColor += vec3( 1.0, 0.65, 0.35 ) * starLayer( uv + 5.0, 10.0, 0.04, 0.04 ) * 0.4;
                starColor += vec3( 0.55, 0.75, 1.0 ) * starLayer( uv - 3.0, 10.0, 0.04, 0.04 ) * 0.4;

                // === Compose ===
                vec3 bgColor    = vec3( 0.01, 0.01, 0.04 );
                vec3 finalColor = bgColor + nebulaColor * 0.45 + starColor;

                gl_FragColor = vec4( finalColor, 1.0 );
            }
        `}),this.plane=new THREE.Mesh(e,this.material),this.scene.add(this.plane)}setupMouseHandler(){this.container.addEventListener(`mousemove`,e=>{let t=this.container.getBoundingClientRect();this.targetMouseX=(e.clientX-t.left)/t.width*2-1,this.targetMouseY=-((e.clientY-t.top)/t.height*2-1)}),this.container.addEventListener(`mouseleave`,()=>{this.targetMouseX=0,this.targetMouseY=0})}setupResizeHandler(){window.addEventListener(`resize`,()=>{let e=this.container.offsetWidth,t=this.container.offsetHeight;this.renderer.setSize(e,t),this.material.uniforms.resolution.value.set(e,t)})}animate(){requestAnimationFrame(()=>this.animate()),this.mouseX+=(this.targetMouseX-this.mouseX)*.05,this.mouseY+=(this.targetMouseY-this.mouseY)*.05,this.material.uniforms.time.value=performance.now()*.001,this.material.uniforms.mouse.value.set(this.mouseX,this.mouseY),this.renderer.render(this.scene,this.camera)}},n=class{constructor(){this.startX,this.startY,this.startTime,this.scrollLeft,this.arrowStep=100,this.spaceStep=window.innerWidth*.8,this.batteryLevel=document.getElementById(`battery-level`),this.location=document.getElementById(`location`),this.targetScrollLeft=0,this.currentScrollLeft=0,this.scrollVelocity=0,this.isScrolling=!1,this.easing=.15,this.velocityFriction=.9,this.wheelMultiplier=.3,this.scrollOffset=.5,this.tapThreshold=10,this.tapTimeThreshold=300,this.isTouchDevice=window.matchMedia(`(pointer: coarse)`).matches,this.hasScrolled=!1,this.bindEvents(),this.setHeight(),document.fonts&&document.fonts.ready?document.fonts.ready.then(()=>this.fitHeaderText()):this.fitHeaderText(),this.bouncePhoto(),this.bindAccessForm(),this.logStuff()}bindEvents(){window.addEventListener(`resize`,this.fitHeaderText.bind(this)),document.addEventListener(`touchstart`,this.handleTouchScrollStart.bind(this),{passive:!0}),this.isTouchDevice?(document.addEventListener(`touchmove`,this.handleTouchScrollToTap.bind(this),{passive:!1}),document.addEventListener(`touchend`,this.handleTouchScrollEnd.bind(this),{passive:!0})):document.addEventListener(`touchmove`,this.handleTouchScrollMove.bind(this),{passive:!1}),document.addEventListener(`keydown`,this.handleKeyScroll.bind(this)),window.addEventListener(`wheel`,this.handleWheelScroll.bind(this),{passive:!1}),this.bindAnchorLinks()}bindAnchorLinks(){document.querySelectorAll(`a[href^="#"]`).forEach(e=>{e.addEventListener(`click`,t=>{let n=e.getAttribute(`href`).slice(1),r=document.getElementById(n);if(!r)return;t.preventDefault(),this.isScrolling=!1,this.scrollVelocity=0;let i=r.getBoundingClientRect().left+window.scrollX;this.targetScrollLeft=i,window.scrollTo({left:i,behavior:`smooth`})})})}bindAccessForm(){let e=document.querySelector(`.access-form`);if(!e)return;let t=e.querySelector(`input[type="password"]`);e.addEventListener(`submit`,n=>{n.preventDefault(),e.classList.add(`is-error`),t&&t.focus()}),t&&t.addEventListener(`input`,()=>{e.classList.remove(`is-error`)})}bouncePhoto(){let e=document.querySelector(`.header`),t=document.querySelector(`.header__photo`);if(!e||!t)return;let n=Math.random()*(e.offsetWidth-t.offsetWidth),r=Math.random()*(e.offsetHeight-t.offsetHeight),i=1.2,a=.9,o=0,s=()=>{let c=e.offsetWidth,l=e.offsetHeight,u=t.offsetWidth,d=t.offsetHeight;n+=i,r+=a,n<=0&&(n=0,i=Math.abs(i)),n+u>=c&&(n=c-u,i=-Math.abs(i)),r<=0&&(r=0,a=Math.abs(a)),r+d>=l&&(r=l-d,a=-Math.abs(a)),o+=.5,t.style.transform=`rotate(${o}deg)`,t.style.left=n+`px`,t.style.top=r+`px`,requestAnimationFrame(s)};s()}fitHeaderText(){let e=document.querySelector(`.header__about`),t=e&&e.querySelector(`h1`);if(!e||!t)return;let n=getComputedStyle(e),r=parseFloat(n.paddingTop)||0,i=parseFloat(n.paddingBottom)||0,a=e.clientHeight-r-i,o=10,s=300;for(t.style.fontSize=``;o<s-1;){let e=Math.floor((o+s)/2);t.style.fontSize=e+`px`,t.scrollHeight<=a?o=e:s=e}t.style.fontSize=o+`px`}setHeight(){window.matchMedia(`(pointer: coarse)`).matches&&(document.getElementById(`container`).style.height=window.innerHeight+`px`)}logStuff(){let e=Array(10).join(`☃`),t=`color: #fff; text-shadow: 0px -1px 4px white, 0px -2px 10px yellow, 0px -10px 20px #ff8000, 0px -18px 40px red; font: 80px "Comic Sans";`;console.log(`%c ${e}`,t),console.log(`%c Snow glad to see you`,t),console.log(`%c ${e}`,t)}logSize(){if(window.location.hash===`#size`){let e=document.createElement(`div`);Object.assign(e.style,{position:`fixed`,bottom:`20px`,right:`20px`,backgroundColor:`rgba(0, 0, 0, 0.7)`,color:`white`,fontFamily:`monospace`,fontSize:`14px`,padding:`10px`,borderRadius:`5px`,zIndex:`9999`}),document.body.appendChild(e),e.textContent=`Window: ${window.innerWidth}px × ${window.innerHeight}px`}}handleTouchScrollStart(e){this.startX=e.touches[0].clientX,this.startY=e.touches[0].clientY,this.startTime=Date.now(),this.hasScrolled=!1}handleTouchScrollMove(e){e.preventDefault();let t=Math.abs(this.startX-e.touches[0].clientX),n=Math.abs(this.startY-e.touches[0].clientY);(t>10||n>10)&&(t>n?window.scrollBy({left:(this.startX-e.touches[0].clientX)*this.scrollOffset,behavior:`auto`}):window.scrollBy({left:(this.startY-e.touches[0].clientY)*this.scrollOffset,behavior:`auto`}))}handleTouchScrollToTap(e){e.preventDefault();let t=e.touches[0].clientX,n=e.touches[0].clientY,r=this.startX-t,i=this.startY-n;if((Math.abs(r)>this.tapThreshold||Math.abs(i)>this.tapThreshold)&&!this.hasScrolled){this.hasScrolled=!0;let e=(Math.abs(r)>Math.abs(i)?r:i)>0?1:-1;window.scrollBy({left:window.innerWidth*e,behavior:`smooth`})}}handleTouchScrollEnd(e){if(this.hasScrolled)return;let t=e.changedTouches[0].clientX,n=e.changedTouches[0].clientY,r=Date.now(),i=Math.abs(this.startX-t),a=Math.abs(this.startY-n),o=r-this.startTime;if(i<this.tapThreshold&&a<this.tapThreshold&&o<this.tapTimeThreshold){let e=t<window.innerWidth/2?-1:1;window.scrollBy({left:window.innerWidth*e,behavior:`smooth`})}}handleKeyScroll(e){if(e.key==` `||e.code==`Space`||e.keyCode==32){e.preventDefault(),e.shiftKey?window.scrollBy({left:-this.spaceStep,behavior:`smooth`}):window.scrollBy({left:this.spaceStep,behavior:`smooth`});return}switch(e.key){case`ArrowUp`:case`ArrowLeft`:e.preventDefault(),e.metaKey?window.scrollTo({left:0,behavior:`smooth`}):window.scrollBy({left:-this.arrowStep,behavior:`smooth`});break;case`ArrowDown`:case`ArrowRight`:e.preventDefault(),e.metaKey?window.scrollTo({left:document.body.scrollWidth,behavior:`smooth`}):window.scrollBy({left:this.arrowStep,behavior:`smooth`})}}handleWheelScroll(e){e.preventDefault();let t=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;this.scrollVelocity+=t*this.wheelMultiplier,this.isScrolling||(this.isScrolling=!0,this.targetScrollLeft=window.scrollX,this.smoothScroll())}smoothScroll(){this.scrollVelocity*=this.velocityFriction,this.targetScrollLeft+=this.scrollVelocity;let e=document.documentElement.scrollWidth-window.innerWidth,t=Math.max(0,Math.min(e,this.targetScrollLeft));t!==this.targetScrollLeft&&(this.targetScrollLeft=t,this.scrollVelocity=0);let n=this.targetScrollLeft-window.scrollX;Math.abs(n)>.5||Math.abs(this.scrollVelocity)>.5?(window.scrollBy(n*this.easing,0),requestAnimationFrame(()=>this.smoothScroll())):(this.isScrolling=!1,this.targetScrollLeft=window.scrollX,this.scrollVelocity=0)}createScrollSettings(){let e=document.createElement(`div`);e.id=`scroll-settings-panel`,e.style.cssText=`
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
        `;let t=document.createElement(`div`);t.textContent=`Scroll Settings`,t.style.cssText=`
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        `,e.appendChild(t),[{name:`arrowStep`,label:`Arrow Step`,min:10,max:500,step:10},{name:`easing`,label:`Easing`,min:.01,max:.5,step:.01},{name:`velocityFriction`,label:`Velocity Friction`,min:.7,max:.99,step:.01},{name:`scrollOffset`,label:`Touch Offset`,min:.1,max:2,step:.1},{name:`tapThreshold`,label:`Tap Threshold (px)`,min:5,max:50,step:5},{name:`tapTimeThreshold`,label:`Tap Time (ms)`,min:100,max:1e3,step:50}].forEach(t=>{let n=document.createElement(`div`);n.style.cssText=`margin-bottom: 15px;`;let r=document.createElement(`div`);r.style.cssText=`display: flex; justify-content: space-between; margin-bottom: 5px;`;let i=document.createElement(`label`);i.textContent=t.label,i.style.cssText=`color: #aaa;`;let a=document.createElement(`span`);a.textContent=this[t.name],a.style.cssText=`color: #0f0; font-weight: bold;`,r.appendChild(i),r.appendChild(a);let o=document.createElement(`input`);o.type=`range`,o.min=t.min,o.max=t.max,o.step=t.step,o.value=this[t.name],o.style.cssText=`width: 100%; cursor: pointer;`,o.addEventListener(`input`,e=>{let n=parseFloat(e.target.value);this[t.name]=n,a.textContent=n}),n.appendChild(r),n.appendChild(o),e.appendChild(n)});let n=document.createElement(`button`);n.textContent=`Hide`,n.style.cssText=`
            width: 100%;
            padding: 8px;
            margin-top: 10px;
            background: #333;
            color: white;
            border: 1px solid #555;
            border-radius: 4px;
            cursor: pointer;
            font-family: monospace;
        `;let r=!1;e.querySelector(`div`).parentElement,n.addEventListener(`click`,()=>{r=!r,r?(Array.from(e.children).forEach((e,t)=>{t>0&&e!==n&&(e.style.display=`none`)}),n.textContent=`Show`,e.style.minWidth=`120px`):(Array.from(e.children).forEach(e=>{e.style.display=``}),n.textContent=`Hide`,e.style.minWidth=`280px`)}),e.appendChild(n),document.body.appendChild(e),e.addEventListener(`keydown`,e=>{(e.key===`ArrowUp`||e.key===`ArrowDown`||e.key===`ArrowLeft`||e.key===`ArrowRight`||e.key===` `||e.key===`Space`)&&(e.preventDefault(),e.stopPropagation(),this.handleKeyScroll(e))}),document.addEventListener(`keydown`,t=>{t.key===`s`&&t.shiftKey&&t.metaKey&&(t.preventDefault(),e.style.display=e.style.display===`none`?``:`none`)})}async fetchLocalData(){try{let e=await fetch(`https://us-central1-projects-342417.cloudfunctions.net/battery`);if(!e.ok)throw Error(`Network response was not ok `+e.statusText);let t=await e.json();this.batteryLevel.textContent=`Battery: ${t.batteryLevel}%`,this.location.textContent=`Location: ${t.location}`}catch(e){console.error(`There was a problem with the fetch operation:`,e),this.batteryLevel.innerHTML=``,this.location.innerHTML=``}}};document.addEventListener(`DOMContentLoaded`,()=>{new e(`header-sun`),new t(`footer-moon`),new n});