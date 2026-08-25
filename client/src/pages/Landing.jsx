import Hero from "../components/Hero.jsx";
import About from "../components/About.jsx";

export default function Landing({ navigate }) {
  return (
    <>
      <Hero navigate={navigate} />
      <About />
    </>
  );
}