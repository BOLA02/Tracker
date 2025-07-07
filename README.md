# 💸 Smart Budget Tracker

A full-stack expense tracking app built with **Next.js 14**, **Supabase**, and **TypeScript**, designed to help users manage their monthly budgets, track spending habits, and promote financial discipline using intelligent soft locks and warnings.

---

## 🔍 Features

- 🔐 **Authentication** – User login/signup via Supabase Auth.
- 💰 **Budget Setup** – Set monthly budgets per category (e.g. Transport, Food, Bills).
- 📆 **Smart Daily Allowance** – Automatically divides budget by number of days in the month.
- 🚨 **Overspending Detection** – Warns users when they exceed daily spending allowance.
- 🔒 **Soft Lock System** – Disables spending if a user overspends for 2+ days in a month.
- 📊 **Live Tracker** – View how much has been spent, what remains, and % used.
- 📁 **Transaction History** – Shows all expense records with categories and dates.
- ⚡ **Optimistic UI** – Updates budget and transaction list in real-time.

---

## 🛠️ Tech Stack

| Tech            | Usage                                      |
|-----------------|---------------------------------------------|
| **Next.js 14**  | App framework with App Router               |
| **TypeScript**  | Type safety across components and logic     |
| **Supabase**    | Auth, Database, API (PostgreSQL)            |
| **Tailwind CSS**| Utility-first styling                       |
| **Vercel**      | Hosting & CI/CD deployment                  |
| **Lucide Icons**| Clean open-source UI icons                  |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/budget-tracker.git
cd budget-tracker
