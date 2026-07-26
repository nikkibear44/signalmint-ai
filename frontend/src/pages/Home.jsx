import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Services from "../components/Services";
import Why from "../components/Why";
import Architecture from "../components/Architecture";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <Why />
      <Architecture />
      <Footer />
    </>
  );
}

export default Home;