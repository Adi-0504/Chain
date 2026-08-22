const ChainAnimation = {

  screenIn(screen) {
    gsap.fromTo(
      screen,
      {
        opacity: 0,
        y: 12
      },
      {
        opacity: 1,
        y: 0,
        duration: .35,
        ease: "power2.out"
      }
    );
  },

  challengeCards(cards) {
    gsap.fromTo(
      cards,
      {
        opacity: 0,
        y: 20
      },
      {
        opacity: 1,
        y: 0,
        duration: .45,
        stagger: .08,
        ease: "power2.out"
      }
    );
  },

  neutralTap(cell) {
    gsap.timeline()
      .to(cell, {
        x: -3,
        duration: .05
      })
      .to(cell, {
        x: 3,
        duration: .05
      })
      .to(cell, {
        x: 0,
        duration: .05
      });
  },

  place(cell) {
    gsap.fromTo(
      cell,
      {
        scale: .65,
        opacity: .5
      },
      {
        scale: 1,
        opacity: 1,
        duration: .2,
        ease: "back.out(2)"
      }
    );
  },

  success(cells) {
    const timeline =
      gsap.timeline();

    timeline
      .to(cells, {
        scale: 1.08,
        duration: .18,
        stagger: .025,
        ease: "power2.out"
      })
      .to(cells, {
        scale: 1,
        duration: .2,
        stagger: .02,
        ease: "back.out(1.6)"
      });

    return timeline;
  },

  clearBoard(cells) {
    const timeline =
      gsap.timeline();

    timeline
      .to(cells, {
        scale: 1.18,
        opacity: 1,
        duration: .16,
        stagger: .025,
        ease: "power2.out"
      })
      .to(cells, {
        scale: 0,
        opacity: 0,
        duration: .28,
        stagger: .025,
        ease: "power2.in"
      });

    return timeline;
  },

  result() {
    gsap.fromTo(
      ".result-card",
      {
        opacity: 0,
        y: 25,
        scale: .97
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: .5,
        ease: "power3.out"
      }
    );

    gsap.fromTo(
      ".result-icon",
      {
        scale: .7,
        rotate: -8
      },
      {
        scale: 1,
        rotate: 0,
        duration: .65,
        delay: .12,
        ease: "back.out(2)"
      }
    );
  }
};