// src/screens/MastersScreen.jsx
import React from 'react';
import MastersContent from '../components/MastersContent';
import AccessDenied from '../components/AccessDenied';
import { usePermissions } from '../hooks/usePermissions';

export default function MastersScreen() {
  const { isAdmin } = usePermissions();
  // Masters is strictly admin-only — no employee can access it.
  return isAdmin ? <MastersContent /> : <AccessDenied pageName="Masters" />;
}
