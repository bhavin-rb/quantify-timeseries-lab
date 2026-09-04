import { FiLinkedin, FiMail, FiArrowLeft } from "react-icons/fi";

export default function Contact({ navigate }) {
  return (
    <section className="contact">
      <div
        className="contact-bg"
        style={{ backgroundImage: "url(/images/hero_image_wide.jpg)" }}
      />
      <div className="contact-overlay" />
      <div className="contact-content">
        <div className="contact-card">
          <div className="contact-avatar">BB</div>
          <h2>Bhavin Rasiklal Borkhataria</h2>
          <p className="contact-role">
            Quantitative Analyst (MScFE) &amp; Technical Representative
          </p>
          <div className="contact-links">
            <a
              href="https://www.linkedin.com/in/bhavin-borkhataria-9673839b"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiLinkedin size={18} /> www.linkedin.com/in/bhavin-borkhataria-9673839b
            </a>
            <a href="mailto:bhavin1234@gmail.com">
              <FiMail size={18} /> bhavin1234@gmail.com
            </a>
          </div>
          <button className="btn btn-ghost contact-back" onClick={() => navigate("/")}>
            <FiArrowLeft size={16} /> Back to Home
          </button>
        </div>
      </div>
    </section>
  );
}