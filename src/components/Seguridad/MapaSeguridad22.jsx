import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import Swal from 'sweetalert2';
import { Button, Card, Table, Form, Modal, Alert, Spinner, Row, Col, Nav } from 'react-bootstrap';
import { FaQrcode, FaSearch, FaHistory, FaFileExcel, FaChartBar, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';
import * as QRModule from '@yudiel/react-qr-scanner';
import * as XLSX from 'xlsx';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registra componentes de Chart.js
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export const DashboardSeguridad = () => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    showScanner: false,
    scanAction: 'ingreso', // 'ingreso' o 'egreso'
    scanResult: null,
    registros: [],
    estadisticas: {
      ingresosHoy: 0,
      ingresosSemana: 0,
      ingresosPorDia: []
    },
    filtro: {
      fechaDesde: '',
      fechaHasta: '',
      dni: '',
      patente: '',
      estado: 'todos' // 'todos', 'ingresado', 'egresado'
    },
    activeTab: 'registros' // 'registros', 'estadisticas'
  });

  const { loading, error, showScanner, scanAction, scanResult, registros, estadisticas, filtro, activeTab } = state;

  // Cargar registros iniciales y estadísticas
  useEffect(() => {
    cargarRegistros();
    cargarEstadisticas();
  }, []);

  const cargarRegistros = async (filtros = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let q = collection(db, 'registrosIngresos');
      
      // Aplicar filtros
      const condiciones = [];
      
      if (filtros.fechaDesde || filtros.fechaHasta) {
        const fechaDesde = filtros.fechaDesde ? new Date(filtros.fechaDesde) : new Date(0);
        const fechaHasta = filtros.fechaHasta ? new Date(filtros.fechaHasta) : new Date();
        
        fechaDesde.setHours(0, 0, 0, 0);
        fechaHasta.setHours(23, 59, 59, 999);
        
        condiciones.push(where('fecha', '>=', fechaDesde.toISOString()));
        condiciones.push(where('fecha', '<=', fechaHasta.toISOString()));
      }
      
      if (filtros.dni) condiciones.push(where('dni', '==', filtros.dni));
      if (filtros.patente) condiciones.push(where('patente', '==', filtros.patente));
      if (filtros.estado && filtros.estado !== 'todos') {
        condiciones.push(where('estado', '==', filtros.estado));
      }
      
      if (condiciones.length > 0) {
        q = query(q, ...condiciones);
      } else {
        // Por defecto, mostrar solo los últimos 7 días
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 7);
        q = query(q, where('fecha', '>=', fechaLimite.toISOString()));
      }

      const querySnapshot = await getDocs(q);
      const datos = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        fechaFormateada: new Date(doc.data().fecha).toLocaleDateString()
      }));
      
      setState(prev => ({
        ...prev,
        registros: datos,
        loading: false
      }));
    } catch (err) {
      console.error("Error al cargar registros:", err);
      setState(prev => ({
        ...prev,
        error: 'Error al cargar registros',
        loading: false
      }));
    }
  };

  const cargarEstadisticas = async () => {
    try {
      // Ingresos de hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const qHoy = query(
        collection(db, 'registrosIngresos'),
        where('fecha', '>=', hoy.toISOString()),
        where('estado', '==', 'ingresado')
      );
      const hoySnapshot = await getDocs(qHoy);
      
      // Ingresos de la semana
      const semanaPasada = new Date();
      semanaPasada.setDate(semanaPasada.getDate() - 7);
      const qSemana = query(
        collection(db, 'registrosIngresos'),
        where('fecha', '>=', semanaPasada.toISOString()),
        where('estado', '==', 'ingresado')
      );
      const semanaSnapshot = await getDocs(qSemana);
      
      // Ingresos por día de la semana
      const ingresosPorDia = Array(7).fill(0);
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
      semanaSnapshot.forEach(doc => {
        const fecha = new Date(doc.data().fecha);
        const diaSemana = fecha.getDay();
        ingresosPorDia[diaSemana]++;
      });
      
      const datosPorDia = diasSemana.map((dia, index) => ({
        dia,
        cantidad: ingresosPorDia[index]
      }));
      
      setState(prev => ({
        ...prev,
        estadisticas: {
          ingresosHoy: hoySnapshot.size,
          ingresosSemana: semanaSnapshot.size,
          ingresosPorDia: datosPorDia
        }
      }));
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    }
  };

  const handleScan = async (data) => {
    if (data) {
      try {
        const datosInvitado = JSON.parse(data);
        
        if (!datosInvitado.nombre || !datosInvitado.dni || !datosInvitado.lote) {
          throw new Error('QR inválido');
        }

        setState(prev => ({
          ...prev,
          scanResult: datosInvitado,
          showScanner: false
        }));

        await registrarAccion(scanAction, datosInvitado);
        
        Swal.fire({
          icon: 'success',
          title: `${scanAction === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado`,
          text: `${datosInvitado.nombre} ha ${scanAction === 'ingreso' ? 'ingresado' : 'egresado'} correctamente`,
          timer: 3000
        });

        // Recargar datos
        cargarRegistros();
        cargarEstadisticas();

      } catch (error) {
        console.error("Error al leer QR:", error);
        setState(prev => ({
          ...prev,
          error: error.message || 'Error al leer QR. Intente nuevamente.',
          showScanner: false
        }));
      }
    }
  };

  const handleError = (err) => {
    console.error("Error del scanner:", err);
    setState(prev => ({
      ...prev,
      error: 'Error en el scanner de QR',
      showScanner: false
    }));
  };

  const registrarAccion = async (accion, invitado) => {
    try {
      const registro = {
        ...invitado,
        fecha: new Date().toISOString(),
        hora: new Date().toLocaleTimeString(),
        registradoPor: 'Guardia', // En una implementación real, usaría el usuario autenticado
        estado: accion === 'ingreso' ? 'ingresado' : 'egresado'
      };

      await addDoc(collection(db, 'registrosIngresos'), registro);
      
      // Actualizar la lista de registros
      setState(prev => ({
        ...prev,
        registros: [{
          ...registro,
          id: Math.random().toString(36).substring(7), // ID temporal hasta que se recargue
          fechaFormateada: new Date().toLocaleDateString()
        }, ...prev.registros]
      }));

    } catch (error) {
      console.error("Error al registrar acción:", error);
      throw error;
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      filtro: {
        ...prev.filtro,
        [name]: value
      }
    }));
  };

  const aplicarFiltros = () => {
    cargarRegistros(filtro);
  };

  const limpiarFiltros = () => {
    setState(prev => ({
      ...prev,
      filtro: {
        fechaDesde: '',
        fechaHasta: '',
        dni: '',
        patente: '',
        estado: 'todos'
      }
    }));
    cargarRegistros();
  };

  const exportarAExcel = () => {
    const datosExportar = registros.map(reg => ({
      'Fecha': reg.fechaFormateada,
      'Hora': reg.hora,
      'Nombre': reg.nombre,
      'DNI': reg.dni,
      'Patente': reg.patente || 'N/A',
      'Lote': reg.lote,
      'Invitado por': reg.invitador,
      'Estado': reg.estado === 'ingresado' ? 'Ingresado' : 'Egresado',
      'Registrado por': reg.registradoPor
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(datosExportar);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
    XLSX.writeFile(workbook, 'registros_ingresos.xlsx');
  };

  // Datos para el gráfico
  const chartData = {
    labels: estadisticas.ingresosPorDia.map(item => item.dia),
    datasets: [{
      label: 'Ingresos en los últimos 7 días',
      data: estadisticas.ingresosPorDia.map(item => item.cantidad),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Cargando registros...</span>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Dashboard de Seguridad</h2>
      
      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setState(prev => ({ ...prev, error: null }))} dismissible>
          {error}
        </Alert>
      )}

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Card.Title>Registro de Ingresos/Egresos</Card.Title>
          
          <div className="d-flex gap-2 mb-4">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => setState(prev => ({ 
                ...prev, 
                showScanner: true,
                scanAction: 'ingreso'
              }))}
            >
              <FaSignInAlt className="me-2" /> Registrar Ingreso
            </Button>
            
            <Button 
              variant="warning" 
              size="lg"
              onClick={() => setState(prev => ({ 
                ...prev, 
                showScanner: true,
                scanAction: 'egreso'
              }))}
            >
              <FaSignOutAlt className="me-2" /> Registrar Egreso
            </Button>
          </div>

          {showScanner && (
            <Modal
              show={showScanner}
              onHide={() => setState(prev => ({ ...prev, showScanner: false }))}
              centered
              size="lg"
            >
              <Modal.Header closeButton>
                <Modal.Title>Escanear Código QR para {scanAction === 'ingreso' ? 'Ingreso' : 'Egreso'}</Modal.Title>
              </Modal.Header>
              <Modal.Body className="text-center">
              <QrModule.QrScanner
  onDecode={(result) => handleScan(result)}
  onError={(error) => handleError(error)}
  constraints={{
    facingMode: 'environment' // Usar cámara trasera
  }}
/>
                <p className="mt-3">Enfoca el código QR del invitado</p>
              </Modal.Body>
            </Modal>
          )}

          {scanResult && (
            <Card className="mt-3">
              <Card.Body>
                <h5>Último {scanAction} registrado:</h5>
                <Table striped bordered>
                  <tbody>
                    <tr>
                      <th>Nombre</th>
                      <td>{scanResult.nombre}</td>
                    </tr>
                    <tr>
                      <th>DNI</th>
                      <td>{scanResult.dni}</td>
                    </tr>
                    <tr>
                      <th>Patente</th>
                      <td>{scanResult.patente || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th>Lote</th>
                      <td>{scanResult.lote}</td>
                    </tr>
                    <tr>
                      <th>Invitado por</th>
                      <td>{scanResult.invitador}</td>
                    </tr>
                    <tr>
                      <th>Estado</th>
                      <td>{scanAction === 'ingreso' ? 'Ingresado' : 'Egresado'}</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      <Nav variant="tabs" activeKey={activeTab} onSelect={(key) => setState(prev => ({ ...prev, activeTab: key }))}>
        <Nav.Item>
          <Nav.Link eventKey="registros">
            <FaHistory className="me-2" /> Historial
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="estadisticas">
            <FaChartBar className="me-2" /> Estadísticas
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'registros' ? (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Card.Title>
              <FaHistory className="me-2" /> Historial de Movimientos
            </Card.Title>
            
            <Form className="mb-4">
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Fecha desde</Form.Label>
                    <Form.Control
                      type="date"
                      name="fechaDesde"
                      value={filtro.fechaDesde}
                      onChange={handleFiltroChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Fecha hasta</Form.Label>
                    <Form.Control
                      type="date"
                      name="fechaHasta"
                      value={filtro.fechaHasta}
                      onChange={handleFiltroChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>DNI</Form.Label>
                    <Form.Control
                      type="text"
                      name="dni"
                      value={filtro.dni}
                      onChange={handleFiltroChange}
                      placeholder="Buscar por DNI"
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Patente</Form.Label>
                    <Form.Control
                      type="text"
                      name="patente"
                      value={filtro.patente}
                      onChange={handleFiltroChange}
                      placeholder="Buscar por patente"
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                      name="estado"
                      value={filtro.estado}
                      onChange={handleFiltroChange}
                    >
                      <option value="todos">Todos</option>
                      <option value="ingresado">Ingresados</option>
                      <option value="egresado">Egresados</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex gap-2 mt-3">
                <Button variant="primary" onClick={aplicarFiltros}>
                  <FaSearch className="me-2" /> Buscar
                </Button>
                <Button variant="secondary" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
                <Button variant="success" onClick={exportarAExcel} className="ms-auto">
                  <FaFileExcel className="me-2" /> Exportar a Excel
                </Button>
              </div>
            </Form>

            {registros.length > 0 ? (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Nombre</th>
                      <th>DNI</th>
                      <th>Patente</th>
                      <th>Lote</th>
                      <th>Invitado por</th>
                      <th>Estado</th>
                      <th>Registrado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((reg) => (
                      <tr key={reg.id} className={reg.estado === 'ingresado' ? 'table-success' : 'table-warning'}>
                        <td>{reg.fechaFormateada}</td>
                        <td>{reg.hora}</td>
                        <td>{reg.nombre}</td>
                        <td>{reg.dni}</td>
                        <td>{reg.patente || 'N/A'}</td>
                        <td>{reg.lote}</td>
                        <td>{reg.invitador}</td>
                        <td>{reg.estado === 'ingresado' ? 'Ingresado' : 'Egresado'}</td>
                        <td>{reg.registradoPor}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <Alert variant="info">No se encontraron registros</Alert>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Card.Title>
              <FaChartBar className="me-2" /> Estadísticas de Ingresos
            </Card.Title>
            
            <Row className="mb-4">
              <Col md={6}>
                <Card>
                  <Card.Body className="text-center">
                    <h3>{estadisticas.ingresosHoy}</h3>
                    <p className="text-muted">Ingresos hoy</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <Card.Body className="text-center">
                    <h3>{estadisticas.ingresosSemana}</h3>
                    <p className="text-muted">Ingresos esta semana</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <h4 className="mb-3">Ingresos por día de la semana</h4>
            <div style={{ height: '300px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};