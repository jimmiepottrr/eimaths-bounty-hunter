/**
 * เนื้อหาหน้า "ข้อมูลบริษัท" — เก็บแยกตามภาษา (th/en/zh)
 * เนื้อหาต้นฉบับ (ไทย) จาก Jim · en/zh แปลไว้เพื่อให้สลับภาษาได้ครบ
 * แก้เนื้อหาได้ที่ไฟล์นี้ไฟล์เดียว
 */

export type CompanyContent = {
  about: { title: string; paragraphs: string[]; closing: string[] };
  concept: { title: string; tagline: string; pillars: { key: string; desc: string }[] };
  vision: { title: string; quote: string; paragraphs: string[] };
  mission: { title: string; items: { head: string; desc: string }[] };
  services: { title: string; intro: string; items: { title: string; desc: string }[] };
  why: { title: string; items: { no: string; en: string; th: string }[] };
};

const th: CompanyContent = {
  about: {
    title: 'เกี่ยวกับบริษัท',
    paragraphs: [
      'บริษัท คอปเปอร์ 8000 จำกัด ก่อตั้งขึ้นเพื่อรองรับการเติบโตและการขยายตัวของธุรกิจด้านทองแดงและโลหะ โดยต่อยอดจากประสบการณ์และความเชี่ยวชาญในธุรกิจโลหะ พร้อมมุ่งพัฒนาสู่การเป็นหนึ่งในผู้ขับเคลื่อนธุรกิจโลหะยุคใหม่ที่มีประสิทธิภาพและเติบโตอย่างยั่งยืน',
      'เราให้ความสำคัญกับการสร้าง “คุณค่าจากโลหะ” มากกว่าการมองวัตถุดิบเป็นเพียงสินค้า ด้วยการพัฒนากระบวนการจัดหา คัดแยก จัดการ และส่งต่อวัตถุดิบให้เกิดประโยชน์สูงสุด พร้อมเชื่อมโยงผู้ผลิต ผู้จัดหา และผู้ใช้วัตถุดิบเข้าด้วยกัน เพื่อสร้างเครือข่ายทางธุรกิจที่มีประสิทธิภาพ โปร่งใส และพร้อมเติบโตไปด้วยกัน',
      'ด้วยแนวคิดในการพัฒนาอย่างต่อเนื่อง เรามองหาโอกาสใหม่ ๆ ในธุรกิจโลหะ พร้อมนำเทคโนโลยี ข้อมูล และแนวคิดด้านเศรษฐกิจหมุนเวียนมาประยุกต์ใช้ เพื่อเพิ่มประสิทธิภาพ ลดการสูญเสีย และสร้างมูลค่าเพิ่มให้กับทรัพยากรในทุกขั้นตอน',
    ],
    closing: ['เพราะเราไม่ได้มองเพียง “โลหะ”', 'แต่เรามองเห็น “คุณค่า” และ “โอกาส” ที่ซ่อนอยู่ในทุกทรัพยากร'],
  },
  concept: {
    title: 'แนวคิดของเรา',
    tagline: 'CONNECT • VALUE • GROW',
    pillars: [
      { key: 'CONNECT', desc: 'เชื่อมโยงผู้ผลิต ผู้จัดหา และผู้ใช้วัตถุดิบเข้าด้วยกัน' },
      { key: 'VALUE', desc: 'เปลี่ยนทรัพยากรให้เกิดคุณค่าและมูลค่าเพิ่มสูงสุด' },
      { key: 'GROW', desc: 'เติบโตไปพร้อมกับลูกค้า คู่ค้า และระบบธุรกิจที่ยั่งยืน' },
    ],
  },
  vision: {
    title: 'วิสัยทัศน์',
    quote: 'มุ่งสู่การเป็นกลุ่มธุรกิจด้านโลหะที่มีความน่าเชื่อถือ มีประสิทธิภาพ และเติบโตอย่างยั่งยืน',
    paragraphs: [
      'เรามุ่งพัฒนาธุรกิจให้มีความคล่องตัวและสามารถรองรับการเปลี่ยนแปลงของตลาด พร้อมสร้างความแตกต่างด้วยคุณภาพ ประสิทธิภาพ เทคโนโลยี และความสัมพันธ์ระยะยาวกับคู่ค้า',
      'เราเชื่อว่าการเติบโตที่แท้จริงไม่ได้เกิดจากการขยายธุรกิจเพียงอย่างเดียว แต่เกิดจากการสร้างระบบธุรกิจที่แข็งแรง สามารถสร้างคุณค่าให้กับทุกฝ่าย และพร้อมต่อยอดสู่โอกาสใหม่ในอนาคต',
    ],
  },
  mission: {
    title: 'พันธกิจ',
    items: [
      { head: 'พัฒนาอย่างต่อเนื่อง', desc: 'ยกระดับกระบวนการคัดแยก จัดการ และบริหารวัตถุดิบให้มีประสิทธิภาพมากยิ่งขึ้น' },
      { head: 'เชื่อมโยงธุรกิจอย่างมีคุณค่า', desc: 'สร้างเครือข่ายระหว่างผู้ผลิต ผู้จัดหา และผู้ใช้วัตถุดิบ เพื่อเพิ่มประสิทธิภาพของห่วงโซ่อุปทาน' },
      { head: 'ขับเคลื่อนด้วยเทคโนโลยี', desc: 'นำเทคโนโลยี ข้อมูล และแนวคิดใหม่มาประยุกต์ใช้ในการดำเนินงาน' },
      { head: 'สร้างความสัมพันธ์ระยะยาว', desc: 'มุ่งสร้างความไว้วางใจและความร่วมมือที่มั่นคงกับลูกค้าและคู่ค้า' },
      { head: 'ใช้ทรัพยากรอย่างคุ้มค่า', desc: 'สนับสนุนแนวคิดเศรษฐกิจหมุนเวียนและการนำทรัพยากรกลับมาใช้ให้เกิดประโยชน์สูงสุด' },
      { head: 'เติบโตอย่างยั่งยืน', desc: 'สร้างรากฐานธุรกิจที่แข็งแรง พร้อมขยายศักยภาพและต่อยอดสู่ธุรกิจโลหะในอนาคต' },
    ],
  },
  services: {
    title: 'บริการของเรา',
    intro:
      'เรามุ่งมั่นให้บริการรับซื้อโลหะด้วยมาตรฐานที่โปร่งใส รวดเร็ว และตรวจสอบได้ พร้อมดูแลทุกขั้นตอนอย่างเป็นระบบ เพื่อสร้างความมั่นใจและความสะดวกให้กับคู่ค้า',
    items: [
      {
        title: 'รับซื้อโลหะที่คลังสินค้า',
        desc: 'ตรวจสอบคุณภาพและชั่งน้ำหนักต่อหน้าคู่ค้าอย่างชัดเจน พร้อมดำเนินการซื้อ-ขายด้วยความโปร่งใสและเป็นธรรม',
      },
      {
        title: 'จองราคาล่วงหน้าผ่านระบบออนไลน์',
        desc: 'ตรวจสอบและจองราคาผ่านเว็บไซต์ได้สะดวก ราคาที่ได้รับการยืนยันคือราคาที่ใช้ในการซื้อ-ขายจริง ช่วยให้คู่ค้าบริหารจัดการการขายได้อย่างมั่นใจ',
      },
      {
        title: 'ชำระเงินรวดเร็ว',
        desc: 'หลังจากตรวจรับและชั่งน้ำหนักเรียบร้อย เราดำเนินการโอนเงินเข้าบัญชีคู่ค้าทันที เพื่อให้ทุกธุรกรรมรวดเร็ว คล่องตัว และตรวจสอบได้',
      },
    ],
  },
  why: {
    title: 'จุดเด่นของเรา',
    items: [
      { no: '01', en: 'Transparent Pricing', th: 'ราคาชัดเจน โปร่งใส ตรวจสอบได้' },
      { no: '02', en: 'Accurate Weighing', th: 'ชั่งน้ำหนักต่อหน้าคู่ค้า' },
      { no: '03', en: 'Fast Payment', th: 'ตรวจรับเสร็จ โอนเงินรวดเร็ว' },
      { no: '04', en: 'Professional Service', th: 'บริการเป็นระบบ พร้อมดูแลคู่ค้าทั้งรายย่อยและธุรกิจ' },
    ],
  },
};

const en: CompanyContent = {
  about: {
    title: 'About Us',
    paragraphs: [
      'Copper 8000 Co., Ltd. was founded to support the growth and expansion of the copper and metals business, building on years of experience and expertise in the metals industry, with a commitment to becoming one of the efficient, sustainable drivers of the modern metals business.',
      'We focus on creating “value from metal” rather than treating raw material as mere commodity — refining how we source, sort, manage and pass on materials for maximum benefit, while connecting producers, suppliers and end-users into an efficient, transparent business network ready to grow together.',
      'With a philosophy of continuous improvement, we seek new opportunities in the metals business and apply technology, data and circular-economy thinking to raise efficiency, reduce waste and add value to resources at every step.',
    ],
    closing: ['Because we don’t see just “metal” —', 'we see the “value” and “opportunity” hidden in every resource.'],
  },
  concept: {
    title: 'Our Philosophy',
    tagline: 'CONNECT • VALUE • GROW',
    pillars: [
      { key: 'CONNECT', desc: 'Connecting producers, suppliers and end-users together.' },
      { key: 'VALUE', desc: 'Turning resources into the highest value and added worth.' },
      { key: 'GROW', desc: 'Growing together with customers, partners and a sustainable business system.' },
    ],
  },
  vision: {
    title: 'Vision',
    quote: 'To become a trusted, efficient and sustainably growing group of metals businesses.',
    paragraphs: [
      'We develop an agile business able to adapt to market change, setting ourselves apart through quality, efficiency, technology and long-term partner relationships.',
      'We believe true growth comes not from expansion alone, but from building a strong business system that creates value for every party and is ready to unlock new opportunities ahead.',
    ],
  },
  mission: {
    title: 'Our Mission',
    items: [
      { head: 'Continuous improvement', desc: 'Elevate sorting, handling and material management to ever-greater efficiency.' },
      { head: 'Connect business with value', desc: 'Build a network among producers, suppliers and end-users to strengthen the supply chain.' },
      { head: 'Driven by technology', desc: 'Apply technology, data and new thinking across our operations.' },
      { head: 'Long-term relationships', desc: 'Build trust and stable cooperation with customers and partners.' },
      { head: 'Resource efficiency', desc: 'Support the circular economy and reuse resources for maximum benefit.' },
      { head: 'Sustainable growth', desc: 'Build strong foundations, expand capability and grow the metals business into the future.' },
    ],
  },
  services: {
    title: 'Our Services',
    intro:
      'We are committed to metal-buying services that are transparent, fast and verifiable, managing every step systematically to give our partners confidence and convenience.',
    items: [
      {
        title: 'Buying at our warehouse',
        desc: 'Quality is checked and weighing is done clearly in front of the partner, with fair and transparent transactions.',
      },
      {
        title: 'Book prices in advance online',
        desc: 'Check and lock prices conveniently on the website. A confirmed price is the price used for the real transaction, helping partners plan their sales with confidence.',
      },
      {
        title: 'Fast payment',
        desc: 'Once inspection and weighing are complete, we transfer payment to the partner’s account immediately — fast, smooth and verifiable.',
      },
    ],
  },
  why: {
    title: 'Why Copper 8000?',
    items: [
      { no: '01', en: 'Transparent Pricing', th: 'Clear, transparent, verifiable prices' },
      { no: '02', en: 'Accurate Weighing', th: 'Weighed in front of the partner' },
      { no: '03', en: 'Fast Payment', th: 'Fast transfer after inspection' },
      { no: '04', en: 'Professional Service', th: 'Systematic service for both retail and business partners' },
    ],
  },
};

const zh: CompanyContent = {
  about: {
    title: '关于我们',
    paragraphs: [
      'Copper 8000 有限公司的成立，旨在支持铜与金属业务的成长与扩张。我们以多年的金属行业经验与专长为基础，致力于成为高效且可持续发展的新一代金属业务推动者之一。',
      '我们重视创造「金属的价值」，而非仅把原料视为商品——不断优化采购、分选、管理与流转的流程，让资源发挥最大效益，同时连接生产者、供应商与原料使用者，构建高效、透明、可共同成长的商业网络。',
      '秉持持续改进的理念，我们不断寻找金属业务的新机会，并运用技术、数据与循环经济思维，提升效率、减少损耗，为每一环节的资源创造附加价值。',
    ],
    closing: ['因为我们看到的不只是「金属」，', '而是隐藏在每一份资源中的「价值」与「机会」。'],
  },
  concept: {
    title: '我们的理念',
    tagline: 'CONNECT • VALUE • GROW',
    pillars: [
      { key: 'CONNECT', desc: '连接生产者、供应商与原料使用者。' },
      { key: 'VALUE', desc: '将资源转化为最高的价值与附加价值。' },
      { key: 'GROW', desc: '与客户、伙伴及可持续的商业体系共同成长。' },
    ],
  },
  vision: {
    title: '愿景',
    quote: '成为值得信赖、高效且可持续成长的金属业务集团。',
    paragraphs: [
      '我们打造灵活的业务，能够应对市场变化，并以品质、效率、技术与长期伙伴关系建立差异化优势。',
      '我们相信，真正的成长不仅来自业务扩张，更来自建立强大的商业体系——为各方创造价值，并随时把握未来的新机会。',
    ],
  },
  mission: {
    title: '我们的使命',
    items: [
      { head: '持续改进', desc: '不断提升分选、处理与原料管理的效率。' },
      { head: '有价值地连接业务', desc: '在生产者、供应商与使用者之间建立网络，强化供应链。' },
      { head: '以技术驱动', desc: '在运营中运用技术、数据与新思维。' },
      { head: '建立长期关系', desc: '与客户和伙伴建立信任与稳固合作。' },
      { head: '珍惜资源', desc: '支持循环经济，让资源再利用发挥最大效益。' },
      { head: '可持续成长', desc: '打造稳固根基，拓展能力，迈向未来的金属业务。' },
    ],
  },
  services: {
    title: '我们的服务',
    intro: '我们致力于提供透明、快速、可查证的金属收购服务，系统化管理每一环节，为伙伴带来信心与便利。',
    items: [
      { title: '仓库现场收购', desc: '在伙伴面前清楚检验品质与称重，交易公平透明。' },
      {
        title: '在线预约锁定价格',
        desc: '在网站上方便地查询并预约价格，确认后的价格即为实际交易价格，帮助伙伴安心规划销售。',
      },
      { title: '快速付款', desc: '验收与称重完成后立即转账至伙伴账户，快速、顺畅、可查证。' },
    ],
  },
  why: {
    title: '我们的优势',
    items: [
      { no: '01', en: 'Transparent Pricing', th: '价格清晰、透明、可查证' },
      { no: '02', en: 'Accurate Weighing', th: '在伙伴面前称重' },
      { no: '03', en: 'Fast Payment', th: '验收后快速转账' },
      { no: '04', en: 'Professional Service', th: '系统化服务，兼顾散户与企业伙伴' },
    ],
  },
};

const MAP: Record<string, CompanyContent> = { th, en, zh };

/** เลือกเนื้อหาตามภาษา — ไม่มีก็ใช้ไทยเป็น fallback */
export const companyContent = (lang: string): CompanyContent => MAP[lang] ?? th;
