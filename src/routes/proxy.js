"use strict";

const http = require('http');
const https = require('https');
const { parse } = require('querystring');

const os = require('os');
var async = require('async');
var request = require('request');
var url = require("url");


var express = require('express');
var router = express.Router();


router.get('/*', (req, res) => {
  console.log("proxy request ...");
  proxyRequest(req, res);
});




module.exports = router;

// Funktion zum Weiterleiten der Anfrage an den Ziel-Host
function proxyRequest(req, res) {
  // Parse die URL, um den Ziel-Host zu extrahieren
  const parsedUrl = url.parse(req.url, true);
  const targetHost = req.headers['x-target-host'] || parsedUrl.query.host;

  if (!targetHost) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing "host" query parameter');
      return;
  }

  // Entferne den 'host' Parameter aus der URL und rekonstruiere den Pfad
  const path = parsedUrl.pathname.replace('/proxy', '') + (parsedUrl.search || '');

  // Erstelle die Optionen für den Weiterleitungs-Request
  const targetUrl = targetHost + path;

  const options = url.parse(targetUrl);
  options.method = req.method;
  options.headers = { ...req.headers };
  delete options.headers['x-target-host'];
  options.headers['Host'] = targetHost.replace("http://", "").replace("https://", "")

  // Entscheide, ob HTTP oder HTTPS verwendet werden soll
  const protocol = options.protocol === 'https:' ? https : http;
  // Falls HTTPS verwendet wird, setze rejectUnauthorized auf false
  if (options.protocol === 'https:') {
      options.rejectUnauthorized = false; // Dies deaktiviert die Zertifikatsprüfung
  }

  console.log("[PROXY]", options);

  // Den Body der POST-Anfrage sammeln, falls vorhanden
  let body = '';
  req.on('data', chunk => {
      body += chunk;
  });

  req.on('end', () => {
      // Falls POST, füge den Body hinzu
      if (req.method === 'POST') {
          options.headers['Content-Length'] = Buffer.byteLength(body);
      }

      // Erstelle den Request an den Ziel-Host
      const proxyReq = protocol.request(options, proxyRes => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
      });

      // Im Fall von POST sende den Body an das Ziel
      if (req.method === 'POST') {
          proxyReq.write(body);
      }

      proxyReq.on('error', err => {
          console.error('Proxy error:', err);
          res.writeHead(502, { 'Content-Type': 'text/plain' });
          res.end("" + err);
      });

      // Request beenden
      proxyReq.end();
  });
}
