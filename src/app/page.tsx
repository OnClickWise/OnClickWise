import About from "@/components/About";
import Feature from "@/components/Feactures";
import ServiceProduct from "@/components/ServiceProduct";
import Horo from "@/components/Heros";
import { LogoTicker } from "@/components/LogoTicker";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Faqs from "@/components/Faqs";
import Pricing from "@/components/Pricing";
import CallToAction from "@/components/CallToAction";


export default function Home() {

 
  return (
    <>
      <Navbar />
      <Horo />
      <LogoTicker />
      <About  />
      <Feature />
      <ServiceProduct />
      <Faqs />
      <Pricing />
      <CallToAction />  
      <Footer />
    </>
  );
}
