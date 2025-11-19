import About from "@/components/About";
import Feature from "@/components/Feactures";
import ServiceProduct from "@/components/ServiceProduct";
import Horo from "@/components/Heros";
import { LogoTicker } from "@/components/LogoTicker";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Faqs from "@/components/Faqs";
import CallToAction from "@/components/CallToAction";


export default function Home() {

 
  return (
    <>
      
      <Header />
      <Horo />
      <LogoTicker />
      <About  />
      <Feature />
      <ServiceProduct />
      <Faqs />
      <CallToAction />  
      <Footer />
    </>
  );
}
