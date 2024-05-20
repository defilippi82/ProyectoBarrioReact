import { useEffect, useState} from 'react';
import { HashRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Invitados } from "./components/Invitados";
import { Reservas } from "./components/Reservas";
import { Administracion } from "./components/Administracion";
import { Login } from "./components/Login";
import { RegistrarReserva } from "./components/RegistrarReservas";
import { RegistrarSocio } from "./components/RegistrarSocios";
import { Panico } from './components/Panico';
import {Contacto} from "./components/Contacto";




export const App = () => {
  
  const [userData, setUserData]  = useState(null);
  
  

  useEffect(() => {
    const userDataFromStorage = localStorage.getItem('userData');
    if (userDataFromStorage) {
      setUserData(JSON.parse(userDataFromStorage));
    }
  }, []);

  // Otros efectos que dependan de userData
  useEffect(() => {
    // Lógica adicional que depende de userData
  }, [userData]);
  
  const handleLogout = () => {
    // Limpiar los datos de usuario al cerrar sesión
    localStorage.removeItem('userData');
    setUserData(null);
   
  };
           
  return (
    
    <div className="App container ">
      <Router>
      
        <header>
        <Navbar expand="lg" className="navbar-collapse ">
            <Container>
            <Navbar.Brand className="navbarbrand" href="#/panico">CUBE{userData && userData.nombre && (<>
            <>¡Hola {userData.nombre}!</></>)}</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav"/>
        <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
            
            {userData && userData.nombre && (
            <>

            <Nav.Link className='navlinks' href="#/panico">Inicio</Nav.Link>
            <Nav.Link className='navlinks' href="#/invitados">Invitados</Nav.Link>
            <Nav.Link className='navlinks' href="#/contacto">Contacto</Nav.Link>
            <Nav.Link className='navlinks' href="#/reservas/create">Reservar</Nav.Link>
            </>
            )}
            {userData && userData.nombre && userData.rol.administrador && (
              <>
              <Nav.Link className='navlinks' href="#/administracion">Administracion</Nav.Link>
              <Nav.Link className='navlinks' href="#/socios/create">Socios</Nav.Link>
            </>
            )}
            {userData && userData.nombre && (
              <>
            <Button variant="outline-danger" href="/" onClick={ handleLogout}>Salir</Button>
            </>

              )}
            
            </Nav>
            </Navbar.Collapse>
            </Container>
          </Navbar>
        </header>

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/panico" element={<Panico />} />
          <Route path="/administracion" element={<Administracion />} />
          <Route path="/invitados" element={<Invitados />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/socios/create" element={<RegistrarSocio />} />
          <Route path="/reservas" element={<Reservas />} />
          <Route path="/reservas/create" element={<RegistrarReserva />} />
          
          {userData ? null : <Route path="*" element={<Navigate to="/" />} />}
      </Routes>
   
      </Router>
    </div>
    
  );
};
