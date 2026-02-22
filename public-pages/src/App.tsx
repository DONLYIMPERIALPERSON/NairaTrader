import Navbar from './components/Navbar';
import Home from './pages/Home';
import RulesPage from './pages/RulesPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import MigratePage from './pages/MigratePage';
import SoftBackdrop from './components/SoftBackdrop';
import Footer from './components/Footer';
import LenisScroll from './components/lenis';

function App() {
	const isRulesPage = window.location.pathname === '/rules';
	const isFaqPage = window.location.pathname === '/faq';
	const isContactPage = window.location.pathname === '/contact';
	const isMigratePage = window.location.pathname === '/migrate';

	return (
		<>
			<SoftBackdrop />
			<LenisScroll />
			{!isMigratePage && <Navbar />}
			{isRulesPage ? <RulesPage /> : isFaqPage ? <FaqPage /> : isContactPage ? <ContactPage /> : isMigratePage ? <MigratePage /> : <Home />}
			{!isMigratePage && <Footer />}
		</>
	);
}
export default App;