import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./MobileCityPreview.css";

export default function MobileCityPreview() {
  const navigate = useNavigate();
  const { t } = useTranslation("mobileCity");

  const [bgReady, setBgReady] = useState(false);

  const bg = useMemo(() => "/preview_city.png", []);

  /* ----------------------------------
     Preload background image
  -----------------------------------*/
  useEffect(() => {
    let alive = true;

    const img = new Image();
    img.src = bg;

    img.onload = () => alive && setBgReady(true);
    img.onerror = () => alive && setBgReady(true);

    return () => {
      alive = false;
    };
  }, [bg]);

  /* ----------------------------------
     Render
  -----------------------------------*/
  return (
    <main className="mcp" aria-label="City preview">
      {/* BACKGROUND */}
      <div className="mcp__bg" aria-hidden="true">
        <img
          className={`mcp__img ${bgReady ? "isReady" : ""}`}
          src={bg}
          alt=""
          draggable={false}
          loading="eager"
          decoding="async"
        />

        <div className="mcp__scan" />
        <div className="mcp__vignette" />
        <div className="mcp__grain" />
      </div>

      {/* CONTENT */}
      <section className="mcp__content">
        <div className="mcp__kicker">CITY</div>

        <h1 className="mcp__title">
          {t("title")}
        </h1>

        <p className="mcp__text">
          {t("description")}
        </p>

        <div className="mcp__actions">
          <button
            type="button"
            className="mcp__btn"
            onClick={() => navigate("/")}
          >
            {t("back")}
          </button>
        </div>

        {/* <div className="mcp__hint">
          {t("subtitle")}
        </div> */}
      </section>
    </main>
  );
}

