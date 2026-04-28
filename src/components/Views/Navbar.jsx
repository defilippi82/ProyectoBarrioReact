import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Container, Button, Nav, Navbar, Badge, Offcanvas, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../Services/UserContext';
import { db } from '/src/firebaseConfig/firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, faHome, faUserFriends, faPhoneAlt, faShieldAlt, 
  faUsersCog, faSignOutAlt, faCalendarAlt, faBullhorn, faLifeRing, faCrown 
} from '@fortawesome/free-solid-svg-icons';
import { useMediaQuery } from 'react-responsive';

export const NavbarComponent = ({ startTutorial }) => {
  // Ahora traemos barrioConfig desde el Context
  const { userData, logout, barrioConfig } = useContext(UserContext);
  const [newMessages, setNewMessages] = useState(0);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 991 });
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Usamos la función del context que limpia todo
    navigate('/login');
  };

  const playSound = useCallback((source) => {
    const audioSrc = source === 'alerta' ? '/Sound/siren.mp3' : '/Sound/mensaje.mp3';
    new Audio(audioSrc).play().catch(e => console.log("Audio play blocked"));
  }, []);

  useEffect(() => {
    if (userData?.manzana && userData?.lote) {
      const q = query(
        collection(db, 'mensajes'),
        where('receiver', '==', `${userData.manzana}-${userData.lote}`),
        where('read', '==', false)
      );
      return onSnapshot(q, (snapshot) => {
        setNewMessages(snapshot.size);
        if (!snapshot.empty) playSound('mensaje');
      });
    }
  }, [userData, playSound]);

  const NavItem = ({ to, icon, text, badge, onClick, className = "" }) => (
    <Nav.Link 
      as={Link} 
      to={to} 
      className={`d-flex align-items-center py-2 px-3 ${className}`} 
      onClick={() => {
        if (onClick) onClick();
        setShowOffcanvas(false);
      }}
    >
      <div className="position-relative me-2">
        <FontAwesomeIcon icon={icon} />
        {badge > 0 && (
          <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle" style={{ fontSize: '0.6rem' }}>
            {badge}
          </Badge>
        )}
      </div>
      <span>{text}</span>
    </Nav.Link>
  );

  if (!userData || !userData.rol) return null;

  const { rol } = userData;
  // Verificamos si es SuperAdmin (GOD)
  const isGod = rol.god === true;

  return (

    <Navbar bg="primary" variant="dark" expand="lg" fixed="top" className="shadow-sm custom-navbar" style={{ backgroundColor: 'var(--navbar-bg)', borderBottom: '2px solid var(--secondary-color)' }}> 
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center">
          <FontAwesomeIcon icon={isGod ? faCrown : faEnvelope} className={isGod ? "text-warning me-2" : "me-2"} />
          <span>{barrioConfig?.nombre || "CUBE"}</span>
          {!isMobile && <span className="ms-2 small fw-normal">| {userData.nombre}</span>}
        </Navbar.Brand>
        
        <Navbar.Toggle onClick={() => setShowOffcanvas(true)} />

        <Navbar.Offcanvas show={showOffcanvas} onHide={() => setShowOffcanvas(false)} placement="end">
          <Offcanvas.Header closeButton className="bg-light">
            <Offcanvas.Title>Menú de {userData.nombre}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            
            {/* INDICADOR DE CUPO PARA ADMINS O GOD */}
            {(rol.administrador || isGod) && barrioConfig && (
              <div className="px-3 mb-3 d-lg-none">
                <small className="text-muted">Cupo de Usuarios: {barrioConfig.usuariosActuales}/{barrioConfig.limiteUsuarios}</small>
                <ProgressBar 
                  variant={barrioConfig.cupoAgotado ? "danger" : "success"} 
                  now={(barrioConfig.usuariosActuales / barrioConfig.limiteUsuarios) * 100} 
                  style={{ height: '5px' }}
                />
              </div>
            )}

            <Nav className="justify-content-end align-items-center flex-grow-1 pe-3">
              
              {/* --- PACK STANDARD --- */}
              <NavItem to="/novedades" icon={faHome} text="Inicio" />
              <NavItem to="/mensajeria" icon={faEnvelope} text="Mensajes" badge={newMessages} />
              <NavItem to="/invitados" icon={faUserFriends} text="Invitados" />
              <NavItem to="/contacto" icon={faPhoneAlt} text="Contacto" />
              
              {(rol.administrador || rol.propietario || isGod) &&
               <NavItem to="/alquileres" icon={faCalendarAlt} text="Alquileres" />}

              {/* --- PACK SEGURIDAD (Solo si está activo o es GOD) --- */}
              {(barrioConfig?.isSeguridad || isGod) && (
                <NavItem to="/panico" icon={faBullhorn} text="Alertas" className="text-warning fw-bold" />
              )}

              {/* --- PACK ADMINISTRATIVO (Solo para Admins/GOD si el pack está activo) --- */}
              {(barrioConfig?.isAdminPack || isGod) && (rol.administrador || isGod) && (
                <>
                  <NavItem to="/reservas" icon={faCalendarAlt} text="Reservas" />
                  <NavItem to="/campanas" icon={faBullhorn} text="Campañas" />
                </>
              )}

              {/* --- ACCESO GUARDIA --- */}
              {(rol.seguridad || rol.administrador || isGod) && (
                <NavItem to="/seguridad" icon={faShieldAlt} text="Guardia" />
              )}

              {/* --- PANEL GOD (SUPER ADMIN) --- */}
              {isGod && (
                <NavItem to="/god-panel" icon={faCrown} text="PANEL GOD" className="text-warning fw-bold bg-dark rounded mt-2 mt-lg-0 ms-lg-2" />
              )}

              {rol.administrador && <NavItem to="/administracion" icon={faUsersCog} text="Panel Admin" />}

              <hr className="d-lg-none" />
              
              <Button 
                variant="outline-light" 
                onClick={() => { startTutorial(); setShowOffcanvas(false); }} 
                className="mt-2 mt-lg-0 ms-lg-3 fw-bold text-nowrap"
              >
                <FontAwesomeIcon icon={faLifeRing} className="me-2" /> AYUDA
              </Button>

              <Button variant="outline-danger" onClick={handleLogout} className="mt-2 mt-lg-0 ms-lg-2 fw-bold text-nowrap">
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> SALIR
              </Button>
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};