# Decentralised Identity Frontend

This repository contains the frontend application for a **Decentralized Identity (DID) and Credential Verification system**. The frontend provides a secure and user-friendly interface for interacting with blockchain-based identity and credential smart contracts.

## Overview

The application allows users to create and manage their **Decentralized Identity (DID)**, grant access to verifiers, and verify academic credentials in a trustless manner. Identity and credential metadata are stored on **IPFS**, while ownership, access control, and issuer authenticity are enforced on-chain using smart contracts.

Wallet-based authentication is used throughout the application, eliminating the need for traditional login systems and ensuring user sovereignty over identity data.

## Features

- Create and view Decentralized Identity (DID)
- Store DID documents on IPFS (Pinata)
- Register DID references on-chain
- Grant and manage access to credentials
- Verify credentials with on-chain permission checks
- Fetch and display credential data from IPFS
- Wallet connection using wagmi and RainbowKit

## Tech Stack

- Next.js (App Router)
- TypeScript
- wagmi & RainbowKit
- IPFS / Pinata
- Tailwind CSS

## Architecture

- **On-chain**: Identity ownership, access control, issuer verification
- **Off-chain**: DID and credential documents stored on IPFS
- **Frontend**: React-based UI for interacting with smart contracts
