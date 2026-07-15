import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import KeywordCategory from '@/app/models/KeywordCategory';

const seedData = [
  {
    name: 'Mobile App Development',
    keywords: [
      'mobile app development',
      'mobile app development services',
      'best mobile app development company in usa',
      'mobile app development near me',
      'mobile application development company'
    ]
  },
  {
    name: 'iPhone App Development',
    keywords: [
      'iphone app development',
      'ios app development services',
      'custom ios app development',
      'ios mobile app development company',
      'ios app development company'
    ]
  },
  {
    name: 'Android App Development',
    keywords: [
      'android app development',
      'android app development company',
      'android app development services',
      'custom android app development',
      'best android app development company',
      'android app development company in usa'
    ]
  },
  {
    name: 'Cross Platform App Development',
    keywords: [
      'cross platform app development',
      'cross platform app development services',
      'best cross platform app development',
      'cross platform app development company'
    ]
  },
  {
    name: 'MVP Startup Development',
    keywords: [
      'mvp development services',
      'mvp development company',
      'mvp software development',
      'mvp app development'
    ]
  },
  {
    name: 'AR Development',
    keywords: [
      'ar development services',
      'ar app development',
      'ar app development services',
      'ar app development company',
      'augmented reality app development services',
      'ar mobile app development'
    ]
  },
  {
    name: 'VR Development',
    keywords: [
      'vr app development',
      'vr app development services',
      'vr app development company',
      'vr mobile app development'
    ]
  },
  {
    name: 'App Maintenance Support Services',
    keywords: [
      'app maintenance and support',
      'app maintenance and support services',
      'app maintenance services',
      'mobile app maintenance services'
    ]
  },
  {
    name: 'Web Application Development Company',
    keywords: [
      'web application development company in usa',
      'web application development company',
      'web application development services',
      'web application development',
      'custom web app development company'
    ]
  },
  {
    name: 'Game Development',
    keywords: [
      'game app development',
      'mobile game development services',
      'Mobile Game Development Company',
      'game app development services',
      'ios game development services',
      'game app development company',
      'mobile game development company'
    ]
  },
  {
    name: '2D Game Development',
    keywords: [
      '2D Game Development',
      '2d game development company',
      '2d game development services',
      'best 2d game development software'
    ]
  },
  {
    name: '3D Game Development',
    keywords: [
      '3d Game Development',
      '3d game development company',
      '3d game development services',
      'best 3d game development software'
    ]
  },
  {
    name: 'Web3 Game Development',
    keywords: [
      'web3 game development',
      'web3 game developers',
      'web3 game development company',
      'Web3 Game Development Services'
    ]
  },
  {
    name: 'Staff Augmentation',
    keywords: [
      'staff augmentation',
      'Staff Augmentation Services',
      'top staff augmentation companies',
      'staff augmentation services company'
    ]
  },
  {
    name: 'Hire Android App Developers',
    keywords: [
      'hire android app developers',
      'hire android app developers in usa',
      'android app developers for hire'
    ]
  },
  {
    name: 'Hire ios App Developers',
    keywords: [
      'hire ios app developers',
      'hire ios app developers in usa',
      'ios app developers for hire'
    ]
  },
  {
    name: 'Hire Nodejs Developers',
    keywords: [
      'hire node js developers',
      'node js developers for hire',
      'hire node js developers in usa',
      'hire node js development company'
    ]
  },
  {
    name: 'Custom Software Development',
    keywords: [
      'Custom Software Development Services',
      'custom software development solutions',
      'custom software development services company',
      'Custom Software Development Company in USA'
    ]
  },
  {
    name: 'ERP Developers',
    keywords: [
      'erp development services',
      'custom enterprise software development',
      'erp software development company in usa',
      'best erp development company'
    ]
  },
  {
    name: 'CRM Developers',
    keywords: [
      'crm development services',
      'crm development company',
      'custom crm development services',
      'crm system development',
      'Custom CRM Software Development Services'
    ]
  },
  {
    name: 'CMS Developers',
    keywords: [
      'cms development services',
      'cms development company in usa',
      'best cms development company',
      'Custom CMS Development Services'
    ]
  },
  {
    name: 'Artificial Intelligence Development',
    keywords: [
      'ai development services',
      'artificial intelligence development services',
      'Artificial Intelligence Development Company'
    ]
  },
  {
    name: 'Generative AI',
    keywords: [
      'generative ai services',
      'generative ai solutions',
      'generative ai development services',
      'custom generative ai development services'
    ]
  },
  {
    name: 'Natural Language Processing Services',
    keywords: [
      'natural language processing services',
      'nlp development services',
      'natural language processing consulting',
      'natural language processing company'
    ]
  },
  {
    name: 'AI Agent Development',
    keywords: [
      'ai agent development services',
      'ai agent development company',
      'custom ai agent development services',
      'ai agent development solutions'
    ]
  },
  {
    name: 'Digital Marketing Agency',
    keywords: [
      'digital marketing service',
      'digital marketing agency in usa',
      'best digital marketing services',
      'top digital marketing agencies usa',
      'digital marketing company near me'
    ]
  },
  {
    name: 'Social Media Marketing Services',
    keywords: [
      'social media marketing services',
      'social media marketing services near me',
      'social media marketing company near me',
      'best social media marketing agency'
    ]
  },
  {
    name: 'Search Engine Marketing',
    keywords: [
      'search engine marketing services',
      'search engine marketing company',
      'search engine marketing agency',
      'search engine marketing services near me'
    ]
  },
  {
    name: 'Search Engine Optimization',
    keywords: [
      'search engine optimization company',
      'best search engine optimization company',
      'search engine optimization agency',
      'search engine optimization services near me'
    ]
  },
  {
    name: 'Blockchain App Development',
    keywords: [
      'blockchain app development services',
      'blockchain app development company',
      'custom blockchain app development',
      'blockchain development agency'
    ]
  },
  {
    name: 'Metaverse Development Company',
    keywords: [
      'metaverse development services',
      'metaverse development company',
      'metaverse app development company'
    ]
  },
  {
    name: 'NFT Development',
    keywords: [
      'nft development services',
      'nft development company',
      'nft game development services'
    ]
  }
];

export async function POST() {
  try {
    await connectToDatabase();

    for (const data of seedData) {
      await KeywordCategory.findOneAndUpdate(
        { name: data.name },
        { name: data.name, keywords: data.keywords },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true, count: seedData.length });
  } catch (error) {
    console.error('Failed to seed keyword categories:', error);
    return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
  }
}
