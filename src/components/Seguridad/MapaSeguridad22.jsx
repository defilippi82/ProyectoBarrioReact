import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '/src/firebaseConfig/firebase.js';
import Swal from 'sweetalert2';
import { Button, Card, Table, Form, Modal, Alert, Spinner, Row, Col, Nav } from 'react-bootstrap';
import { FaSearch, FaHistory, FaFileExcel, FaChartBar, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export const DashboardSeguridad = () => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    showScanner: false,
    scanAction: 'ingreso',
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
      estado: 'todos'
    },
    activeTab: 'registros'
  });

  const scannerRef = useRef(null);

  const { loading, error, showScanner, scanAction, scanResult, registros, estadisticas, filtro, activeTab } = state;

  useEffect(() => {
    cargarRegistros();
    cargarEstadisticas();
  }, []);

  useEffect(() => {
    if (showScanner) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [showScanner]);

  const startScanner = () => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      false
    );

    scanner.render(
      (decodedText) => {
        handleScan({ text: decodedText });
        stopScanner();
      },
      (errorMessage) => {
        handleError(errorMessage);
      }
    );

    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner.", error);
      });
      scannerRef.current = null;
    }
  };

  const cargarRegistros = async (filtros = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let q = collection(db, 'registrosIngresos');
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

      setState(prev => ({ ...prev, registros: datos, loading: false }));
    } catch (err) {
      console.error("Error al cargar registros:", err);
      setState(prev => ({ ...prev, error: 'Error al cargar registros', loading: false }));
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const qHoy = query(collection(db, 'registrosIngresos'), where('fecha', '>=', hoy.toISOString()), where('estado', '==', 'ingresado'));
      const hoySnapshot = await getDocs(qHoy);

      const semanaPasada = new Date();
      semanaPasada.setDate(semanaPasada.getDate() - 7);
      const qSemana = query(collection(db, 'registrosIngresos'), where('fecha', '>=', semanaPasada.toISOString()), where('estado', '==', 'ingresado'));
      const semanaSnapshot = await getDocs(qSemana);

      const ingresosPorDia = Array(7).fill(0);
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      semanaSnapshot.forEach(doc => {
        const fecha = new Date(doc.data().fecha);
        ingresosPorDia[fecha.getDay()]++;
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

  const registrarAccion = async (accion, invitado) => {
    try {
      const registro = {
        ...invitado,
        fecha: new Date().toISOString(),
        hora: new Date().toLocaleTimeString(),
        registradoPor: 'Guardia',
        estado: accion === 'ingreso' ? 'ingresado' : 'egresado'
      };

      await addDoc(collection(db, 'registrosIngresos'), registro);

      setState(prev => ({
        ...prev,
        registros: [{
          ...registro,
          id: Math.random().toString(36).substring(7),
          fechaFormateada: new Date().toLocaleDateString()
        }, ...prev.registros]
      }));
    } catch (error) {
      console.error("Error al registrar acción:", error);
      throw error;
    }
  };

  const handleScan = async (result) => {
    if (result?.text) {
      try {
        const datosInvitado = JSON.parse(result.text);

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

  const aplicarFiltros = () => cargarRegistros(filtro);

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
            <Button variant="primary" size="lg" onClick={() => setState(prev => ({ ...prev, showScanner: true, scanAction: 'ingreso' }))}>
              <FaSignInAlt className="me-2" /> Registrar Ingreso
            </Button>
            <Button variant="warning" size="lg" onClick={() => setState(prev => ({ ...prev, showScanner: true, scanAction: 'egreso' }))}>
              <FaSignOutAlt className="me-2" /> Registrar Egreso
            </Button>
          </div>

          {showScanner && (
            <Modal show={showScanner} onHide={() => setState(prev => ({ ...prev, showScanner: false }))} centered size="lg">
              <Modal.Header closeButton>
                <Modal.Title>Escanear Código QR para {scanAction === 'ingreso' ? 'Ingreso' : 'Egreso'}</Modal.Title>
              </Modal.Header>
              <Modal.Body className="text-center">
                <div id="qr-reader" style={{ width: '100%' }}></div>
                <p className="mt-3">Enfoca el código QR del invitado</p>
              </Modal.Body>
            </Modal>
          )}
        </Card.Body>
      </Card>

      {/* Aquí continúa el historial y las estadísticas sin cambios */}
    </div>
  );
};