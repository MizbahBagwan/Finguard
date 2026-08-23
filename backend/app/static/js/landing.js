document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       NAVBAR SCROLL EFFECT
    ========================================================= */

    const navbar = document.querySelector(".landing-navbar");

    if (navbar) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 30) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        });
    }


    /* =========================================================
       SMOOTH SCROLL
    ========================================================= */

    document.querySelectorAll('a[href^="#"]').forEach(link => {

        link.addEventListener("click", function (e) {

            const targetId = this.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);

            if (target) {
                e.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

        });

    });


    /* =========================================================
       MOBILE MENU
    ========================================================= */

    const menuButton = document.querySelector(".landing-menu-btn");
    const mobileMenu = document.querySelector(".landing-mobile-menu");

    if (menuButton && mobileMenu) {

        menuButton.addEventListener("click", () => {

            mobileMenu.classList.toggle("open");

            menuButton.classList.toggle("active");

        });


        mobileMenu.querySelectorAll("a").forEach(link => {

            link.addEventListener("click", () => {

                mobileMenu.classList.remove("open");
                menuButton.classList.remove("active");

            });

        });

    }


    /* =========================================================
       SCROLL REVEAL
    ========================================================= */

    const revealElements = document.querySelectorAll(
        ".feature-card, .security-card, .landing-stat, .section-heading"
    );

    if ("IntersectionObserver" in window) {

        const observer = new IntersectionObserver(
            (entries, obs) => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add("visible");

                        obs.unobserve(entry.target);

                    }

                });

            },
            {
                threshold: 0.12
            }
        );

        revealElements.forEach(element => {
            element.classList.add("reveal");
            observer.observe(element);
        });

    }


    /* =========================================================
       ANIMATED NUMBER COUNTERS
    ========================================================= */

    const counters = document.querySelectorAll(
        "[data-counter]"
    );

    const animateCounter = element => {

        const target = parseFloat(
            element.getAttribute("data-counter")
        );

        const suffix =
            element.getAttribute("data-suffix") || "";

        const duration = 1600;

        const startTime = performance.now();

        function update(currentTime) {

            const progress = Math.min(
                (currentTime - startTime) / duration,
                1
            );

            const eased =
                1 - Math.pow(1 - progress, 3);

            const value =
                target * eased;

            if (Number.isInteger(target)) {

                element.textContent =
                    Math.floor(value) + suffix;

            } else {

                element.textContent =
                    value.toFixed(1) + suffix;

            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }

        }

        requestAnimationFrame(update);

    };


    if ("IntersectionObserver" in window) {

        const counterObserver =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (entry.isIntersecting) {

                            animateCounter(entry.target);

                            counterObserver.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.5
                }
            );

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });

    }


    /* =========================================================
       AI STATUS PULSE
    ========================================================= */

    const statusDots =
        document.querySelectorAll(".ai-status-dot");

    statusDots.forEach(dot => {

        setInterval(() => {

            dot.classList.toggle("pulse");

        }, 1800);

    });


    /* =========================================================
       HERO DASHBOARD CARD PARALLAX
    ========================================================= */

    const heroCard =
        document.querySelector(".hero-dashboard-card");

    if (heroCard && window.innerWidth > 900) {

        document.addEventListener("mousemove", event => {

            const x =
                (window.innerWidth / 2 - event.clientX) / 70;

            const y =
                (window.innerHeight / 2 - event.clientY) / 70;

            heroCard.style.transform =
                `perspective(1200px)
                 rotateY(${x * -0.35}deg)
                 rotateX(${y * 0.35}deg)`;

        });

        heroCard.addEventListener("mouseleave", () => {

            heroCard.style.transform =
                "perspective(1200px) rotateY(0deg) rotateX(0deg)";

        });

    }


    /* =========================================================
       ACTIVE NAVIGATION LINK
    ========================================================= */

    const sections =
        document.querySelectorAll("section[id]");

    const navLinks =
        document.querySelectorAll(
            ".landing-navbar a[href^='#']"
        );

    if (sections.length && navLinks.length) {

        window.addEventListener("scroll", () => {

            let current = "";

            sections.forEach(section => {

                const sectionTop =
                    section.offsetTop - 160;

                if (window.scrollY >= sectionTop) {
                    current = section.id;
                }

            });

            navLinks.forEach(link => {

                link.classList.remove("active");

                if (
                    link.getAttribute("href") ===
                    `#${current}`
                ) {
                    link.classList.add("active");
                }

            });

        });

    }


    /* =========================================================
       PREVENT BUTTON DOUBLE CLICK
    ========================================================= */

    document.querySelectorAll(
        ".landing-primary-btn"
    ).forEach(button => {

        button.addEventListener("click", () => {

            button.classList.add("clicked");

            setTimeout(() => {
                button.classList.remove("clicked");
            }, 500);

        });

    });


    /* =========================================================
       YEAR
    ========================================================= */

    const yearElement =
        document.querySelector("[data-year]");

    if (yearElement) {
        yearElement.textContent =
            new Date().getFullYear();
    }

});