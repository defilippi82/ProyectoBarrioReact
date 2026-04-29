import React from 'react';

export const Footer = () => {
  return (
    
      <div className="footer text-light text-center p-4">
    <hr className="sm-4" />

      
      <section className="sm-4 text-center">
       
                
        <a
           className="btn btn-outline-light btn-floating m-1"
           href="mailto:federico.filippi@trenesargentinos.gob.ar"
           role="button"
           ><i className="fa fa-train "></i
          ></a>

        <a
           className="btn btn-outline-light btn-floating m-1"
           href="https://www.linkedin.com/in/defilippi/"
           role="button"
           ><i className="fab fa-linkedin-in"></i
          ></a>

        <a
           className="btn btn-outline-light btn-floating m-1"
           href="https://github.com/defilippi82"
           role="button"
           ><i className="fab fa-github"></i
          ></a>
      </section>
      
    
      <img className="rodapie" src="/img/logo-grisSin-fondo.png" width="75px" height="75px" alt="Logo"/>
      <p className="eslogan">Navegá más allá de lo esperado </p>
      <p><em>Todos los derechos reservados.© 2024</em></p>
      <a href="#/privacidad" className="privacidad-link">Política de Privacidad</a>
      
    </div>
  );
};
