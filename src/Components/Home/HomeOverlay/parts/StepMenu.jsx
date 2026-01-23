// src/Components/Home/HomeOverlay/parts/StepMenu.jsx
import React from "react";
import MenuPreview from "./MenuPreview";


export default function StepMenu({
  isActive,
  t,
  MENU,
  menuActiveIndex,
  setMenuActiveIndex,
  onRunAction,
  projectSlides,
  menuAssetsReady,
}) {

  const activeKey = MENU[menuActiveIndex]?.key;

  return (
    <section className={`homeOverlay__slide ${isActive ? "isActive" : ""}`} aria-hidden={!isActive}>
      <div className="homeOverlay__panel">
        <div className="homeOverlay__fx" aria-hidden="true">
          <div className="homeOverlay__orb" />
          <div className="homeOverlay__grid" />
        </div>
        <div className="homeOverlay__shine" aria-hidden="true" />

        <div className="homeOverlay__badge">HOME://PORTAL</div>

        <h1 className="homeOverlay__title">
          {t("menu.titleLine1")}
          <br />
          {t("menu.titleLine2")}
        </h1>

        <p className="homeOverlay__subtitle">{t("menu.subtitle")}</p>

        <div className="homeOverlay__menuShell">
          <div className="homeOverlay__menuCol" role="menu" aria-label={t("a11y.menu")}>
            {MENU.map((item, idx) => {
              const isActiveBtn = idx === menuActiveIndex;
              const btnClass =
                item.kind === "primary" ? "homeOverlay__primaryBtn" : "homeOverlay__secondaryBtn";

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${btnClass} homeOverlay__menuBtn ${isActiveBtn ? "isActive" : ""}`}
                  onMouseEnter={() => setMenuActiveIndex(idx)}
                  onFocus={() => setMenuActiveIndex(idx)}
                  onClick={() => onRunAction(item)}
                >
                  <span className={`homeOverlay__chev ${isActiveBtn ? "isOn" : ""}`} aria-hidden="true">
                    &gt;
                  </span>
                  <span className="homeOverlay__langLabel">{t(`menu.buttons.${item.key}`)}</span>
                </button>
              );
            })}
          </div>

          <aside className="homeOverlay__menuPreview" aria-live="polite">
            <div className="homeOverlay__menuPreviewHeader">
              <span>PREVIEW</span>
              <span>{String(MENU[menuActiveIndex]?.key || "").toUpperCase()}</span>
            </div>
            <div className="homeOverlay__menuPreviewBody">
              <MenuPreview 
                activeKey={activeKey}  
                projectSlides={projectSlides} 
                menuAssetsReady={menuAssetsReady}
                instant
              />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}