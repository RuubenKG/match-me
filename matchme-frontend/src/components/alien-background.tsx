import "../styles/crt-effect.css";

function AlienBackground() {
  return (
    <div
      className="aesthetic-effect-crt"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url(/images/match-me-background.gif)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.7) contrast(1.3)", 
        }}
      >
        {/* Lighter dark overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.2)", // Less dark
          }}
        ></div>

        {/* Stronger green tint */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 255, 100, 0.15)", // More visible green
          }}
        ></div>
      </div>
    </div>
  );
}

export default AlienBackground;
