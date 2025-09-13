import About from "@/components/About";
import Horo from "@/components/Heros"
import { LogoTicker } from "@/components/LogoTicker";
import Navbar from "@/components/Navbar";


export default function Home() {

 
  return (
    <>
      <Horo />
      <Navbar />
      <LogoTicker />
      <About  />
    </>
  );
}
