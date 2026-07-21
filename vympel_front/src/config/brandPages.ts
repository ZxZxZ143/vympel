import {LocaleEnum} from "@/i18n/routing";
import {BrandSlug, findPublicBrandBySlug, PublicBrand} from "@/config/brandRoutes";

type LocalizedBrandText = Record<LocaleEnum, string>;

type BrandPageContent = {
    description: LocalizedBrandText;
    history: LocalizedBrandText;
    brandBannerSrc: string;
    catalogBannerSrc?: string;
    catalogBannerFallbackSrc?: string;
};

export type BrandPageData = PublicBrand & {
    description: string;
    historyParagraphs: string[];
    brandBannerSrc: string;
    catalogBannerSrc?: string;
    hasCatalogBannerFallback: boolean;
};

const localized = (ru: string, kz: string, en: string): LocalizedBrandText => ({
    [LocaleEnum.RU]: ru,
    [LocaleEnum.KZ]: kz,
    [LocaleEnum.EN]: en,
});

const BRAND_PAGE_CONTENT: Record<BrandSlug, BrandPageContent> = {
    romanson: {
        description: localized(
            "Южнокорейский бренд, воплощающий современную эстетику и утончённый минимализм. Каждая модель отражает стремление к гармонии формы и функции, сочетая лаконичный дизайн с высоким качеством исполнения.",
            "Заманауи эстетика мен талғампаз минимализмді бейнелейтін оңтүстіккореялық бренд. Әрбір модель ықшам дизайнды жоғары сапалы орындалумен үйлестіріп, пішін мен функцияның жарасымына деген ұмтылысты көрсетеді.",
            "A South Korean brand embodying contemporary aesthetics and refined minimalism. Each model reflects a pursuit of harmony between form and function, combining concise design with high-quality craftsmanship."
        ),
        history: localized(`Бренд Romanson был основан в 1988 году в Южной Корее и назван в честь швейцарского города Romanshorn, известного своей часовой традицией.

С самого начала компания ориентировалась на сочетание швейцарского качества и оригинального дизайна, что позволило ей быстро завоевать доверие покупателей.

Уже в первые годы Romanson начал экспортировать часы на международные рынки, включая Ближний Восток, Северную Америку и позже Россию и Европу. В 1990-е и 2000-е годы бренд представил несколько значимых коллекций, участвовал в международных выставках вроде Baselworld и открыл собственные производственные и исследовательские центры.

Сегодня Romanson - это глобально известный производитель часов, чья продукция продаётся более чем в 70 странах мира, оставаясь символом сочетания стиля и качества.`,
            `Romanson бренді 1988 жылы Оңтүстік Кореяда құрылып, сағат жасау дәстүрімен танымал Швейцарияның Romanshorn қаласының құрметіне аталды.

Компания алғашқы күннен бастап швейцариялық сапа мен бірегей дизайнды ұштастыруға бағыт алды, соның арқасында сатып алушылардың сеніміне тез ие болды.

Алғашқы жылдардың өзінде Romanson сағаттарын Таяу Шығыс, Солтүстік Америка, кейінірек Ресей мен Еуропаны қоса алғанда халықаралық нарықтарға экспорттай бастады. 1990 және 2000 жылдары бренд бірнеше маңызды топтаманы таныстырып, Baselworld секілді халықаралық көрмелерге қатысты және өз өндірістік әрі зерттеу орталықтарын ашты.

Бүгінде Romanson - өнімдері әлемнің 70-тен астам елінде сатылатын, стиль мен сапа үйлесімінің нышаны болып қалған жаһанға танымал сағат өндірушісі.`,
            `Romanson was founded in South Korea in 1988 and named after the Swiss town of Romanshorn, known for its watchmaking tradition.

From the outset, the company focused on combining Swiss quality with original design, which helped it quickly earn customers' trust.

In its early years, Romanson began exporting watches to international markets, including the Middle East, North America, and later Russia and Europe. During the 1990s and 2000s, the brand introduced several notable collections, took part in international exhibitions such as Baselworld, and opened its own manufacturing and research centers.

Today, Romanson is a globally recognized watch manufacturer whose products are sold in more than 70 countries, remaining a symbol of the union of style and quality.`),
        brandBannerSrc: "/Romanson_brand_banner.webp",
        catalogBannerSrc: "/Romanson_catalog_banner.jpg",
    },
    adriatica: {
        description: localized(
            "Швейцарский бренд часов с богатой историей, воплощающий традиции точного механизма и элегантного классического дизайна. Каждая модель сочетает фирменное качество Swiss Made и универсальный стиль, подходящий как для повседневной носки, так и для торжественных событий.",
            "Дәл механизм мен талғампаз классикалық дизайн дәстүрлерін бейнелейтін, тарихы бай швейцариялық сағат бренді. Әрбір модель Swiss Made фирмалық сапасын күнделікті тағуға да, салтанатты шараларға да үйлесетін әмбебап стильмен ұштастырады.",
            "A Swiss watch brand with a rich history, embodying the traditions of precise movements and elegant classic design. Every model combines signature Swiss Made quality with a versatile style suited to both everyday wear and formal occasions."
        ),
        history: localized(`Бренд Adriatica начал своё существование в 1931 году - тогда его создала швейцарская компания Swiss Watch Company, став частью многовековой часовой традиции Швейцарии.

С момента основания производство часов постоянно развивалось: в 1960-х годах фабрика переехала в часовые центры Биль/Бьен и Базель, где продолжилась работа над коллекциями для мужчин и женщин, включая знаковую линейку “Adriatica World Champion”.

С 1999 года часы производятся на собственной мануфактуре в Донгио (кантон Тичино), а компания принимает участие во внедрении новых технологий и дизайна, укрепляя своё международное присутствие.

Adriatica - признанный швейцарский бренд, хорошо известный на рынках Европы и Северной Америки, чья продукция сочетает надёжность, точность и стиль, подтверждённые знаком Swiss Made.`,
            `Adriatica бренді өз тарихын 1931 жылы бастады - сол кезде оны швейцариялық Swiss Watch Company құрып, Швейцарияның сан ғасырлық сағат жасау дәстүрінің бір бөлігіне айналдырды.

Құрылған сәттен бастап сағат өндірісі үздіксіз дамыды: 1960 жылдары фабрика Биль/Бьен және Базель сағат жасау орталықтарына көшіп, онда ерлер мен әйелдерге арналған топтамалар, соның ішінде әйгілі “Adriatica World Champion” желісі бойынша жұмыс жалғасты.

1999 жылдан бері сағаттар Донгиодағы (Тичино кантоны) жеке мануфактурада өндіріледі, ал компания жаңа технологиялар мен дизайнды енгізуге қатысып, халықаралық қатысуын нығайтып келеді.

Adriatica - Еуропа мен Солтүстік Америка нарықтарында жақсы танымал швейцариялық бренд. Оның өнімдері Swiss Made белгісімен расталған сенімділікті, дәлдікті және стильді үйлестіреді.`,
            `Adriatica began its story in 1931, when it was created by the Swiss Watch Company and became part of Switzerland's centuries-old watchmaking tradition.

Watch production continued to develop from the moment the brand was founded. In the 1960s, the factory moved to the watchmaking centers of Biel/Bienne and Basel, where work continued on collections for men and women, including the landmark “Adriatica World Champion” line.

Since 1999, the watches have been produced at the company's own manufacture in Dongio, in the canton of Ticino. The company also participates in introducing new technologies and design, strengthening its international presence.

Adriatica is an established Swiss brand, well known in European and North American markets, whose products combine reliability, precision, and style confirmed by the Swiss Made mark.`),
        brandBannerSrc: "/Adriatica_brand_banner.jpg",
        catalogBannerSrc: "/Adriatica_catalog_banner.jpg",
    },
    appella: {
        description: localized(
            "Швейцарский бренд часов, сочетающий вековые традиции точного хронометража и элегантный, выдержанный дизайн. Высокая точность механизмов, маркировка Swiss Made и лаконичность делает их универсальными для повседневных и деловых образов.",
            "Дәл уақыт өлшеудің ғасырлық дәстүрін талғампаз әрі ұстамды дизайнмен үйлестіретін швейцариялық сағат бренді. Механизмдердің жоғары дәлдігі, Swiss Made таңбасы және ықшамдылығы оларды күнделікті де, іскерлік образға да әмбебап етеді.",
            "A Swiss watch brand combining centuries-old traditions of precise timekeeping with elegant, restrained design. Highly accurate movements, the Swiss Made mark, and clean styling make the watches versatile for both everyday and business looks."
        ),
        history: localized(`История Appella началась в 1943 году, когда швейцарский мастер часового дела Поль Глокер основал бренд в рамках компании EBOSSA, базировавшейся на производстве механизмов Roskopf - признанных образцов швейцарского качества того времени.

С первых лет своего существования Appella ориентировалась на классическое Swiss Made качество, сочетая надёжные механизмы с изящным дизайном. С течением времени бренд развивался, сохраняя связь с часовой традицией и постепенно расширяя своё присутствие на международных рынках.

В более поздний период бренд перешёл под управление компании ADRIATICA PR & A Watch Sagl, что укрепило его позиции на мировой арене и позволило ещё больше подчеркнуть швейцарское качество, точность и эстетическую выразительность.

Каждая модель отражает уважение к классическому часовому искусству и стремление к совершенству.`,
            `Appella тарихы 1943 жылы басталды. Сол жылы швейцариялық сағат шебері Поль Глокер сол кезеңдегі швейцариялық сапаның мойындалған үлгілері болған Roskopf механизмдерін өндіруге негізделген EBOSSA компаниясының аясында брендті құрды.

Алғашқы жылдардан бастап Appella сенімді механизмдерді әсем дизайнмен ұштастырып, классикалық Swiss Made сапасына бағытталды. Уақыт өте бренд сағат жасау дәстүрімен байланысын сақтай отырып дамып, халықаралық нарықтардағы қатысуын біртіндеп кеңейтті.

Кейінгі кезеңде бренд ADRIATICA PR & A Watch Sagl компаниясының басқаруына өтті. Бұл оның әлемдік аренадағы орнын нығайтып, швейцариялық сапаны, дәлдік пен эстетикалық мәнерлілікті бұрынғыдан да айқындауға мүмкіндік берді.

Әрбір модель классикалық сағат өнеріне деген құрмет пен кемелдікке ұмтылысты көрсетеді.`,
            `Appella's history began in 1943, when Swiss watchmaker Paul Glocker founded the brand within EBOSSA, a company based on producing Roskopf movements, which were recognized examples of Swiss quality at the time.

From its earliest years, Appella focused on classic Swiss Made quality, combining reliable movements with refined design. The brand developed over time while preserving its connection to watchmaking tradition and gradually expanding its presence in international markets.

In a later period, the brand came under the management of ADRIATICA PR & A Watch Sagl. This strengthened its position on the global stage and allowed it to emphasize Swiss quality, precision, and aesthetic expression even further.

Every model reflects respect for classic watchmaking and a pursuit of perfection.`),
        brandBannerSrc: "/Appella_brand_banner.jpg",
        catalogBannerSrc: "/Appella_catalog_banner.jpg",
    },
    "pierre-ricaud": {
        description: localized(
            "Немецкий часовой бренд, в котором классическая элегантность гармонично сочетается с актуальными дизайнерскими решениями. Каждая модель продумана до мелочей: выверенные пропорции, качественные материалы и надёжные механизмы формируют сбалансированный аксессуар.",
            "Классикалық талғампаздық заманауи дизайнерлік шешімдермен үйлесім тапқан неміс сағат бренді. Әрбір модель ұсақ-түйегіне дейін ойластырылған: дәл пропорциялар, сапалы материалдар мен сенімді механизмдер теңгерімді аксессуар қалыптастырады.",
            "A German watch brand in which classic elegance is harmoniously combined with contemporary design solutions. Every model is considered down to the smallest detail: balanced proportions, quality materials, and reliable movements create a well-rounded accessory."
        ),
        history: localized(`Бренд Pierre Ricaud был основан более двадцати лет назад немецким часовым концерном MAKK Uhrenshop. С момента своего появления марка ориентировалась на создание часов, сочетающих европейскую надёжность, актуальный дизайн и доступность для широкой аудитории.

В процессе развития бренд последовательно расширял линейки моделей, уделяя внимание и классическим формам, и современным трендам.

В производстве используются качественные материалы и проверенные механизмы японского и швейцарского производства, что обеспечивает точность хода и долговечность изделий. Дополняя техническую надёжность продуманной эстетикой - сдержанные циферблаты и декоративные элементы, включая кристаллы Swarovski, - Pierre Ricaud смог занять устойчивую позицию на международном рынке и сформировать репутацию стильного и практичного часового бренда с немецким подходом к качеству.`,
            `Pierre Ricaud бренді жиырма жылдан астам уақыт бұрын немістің MAKK Uhrenshop сағат концернімен құрылды. Пайда болған сәттен бастап бренд еуропалық сенімділікті, өзекті дизайнды және кең аудиторияға қолжетімділікті үйлестіретін сағаттар жасауға бағытталды.

Даму барысында бренд классикалық пішіндерге де, заманауи үрдістерге де назар аударып, модельдер желісін біртіндеп кеңейтті.

Өндірісте сапалы материалдар және Жапония мен Швейцарияда жасалған тексерілген механизмдер қолданылады, бұл бұйымдардың дәл жүруі мен ұзақ қызмет етуін қамтамасыз етеді. Техникалық сенімділікті ұстамды циферблаттар мен Swarovski кристалдарын қоса алғандағы сәндік элементтер секілді ойластырылған эстетикамен толықтыра отырып, Pierre Ricaud халықаралық нарықта тұрақты орын алып, сапаға немісше көзқарасы бар стильді әрі практикалық сағат бренді ретінде бедел қалыптастырды.`,
            `Pierre Ricaud was founded more than twenty years ago by the German watch group MAKK Uhrenshop. From the time it appeared, the brand focused on creating watches that combine European reliability, contemporary design, and accessibility for a broad audience.

As it developed, the brand steadily expanded its model lines, paying attention to both classic forms and modern trends.

Production uses quality materials and proven Japanese and Swiss movements, ensuring accurate timekeeping and product durability. By complementing technical reliability with considered aesthetics—restrained dials and decorative elements including Swarovski crystals—Pierre Ricaud established a stable position in the international market and built a reputation as a stylish, practical watch brand with a German approach to quality.`),
        brandBannerSrc: "/PIERRE_RICAUD_brand_banner.webp",
        catalogBannerSrc: "/Pierre_ricaud_catalog_banner.jpg",
    },
    rhythm: {
        description: localized(
            "Японский бренд с богатой историей в производстве часов и механизмов, известный сочетанием технической точности и продуманного дизайна. Его изделия предлагают стильные и практичные решения. Rhythm уделяет особое внимание качеству материалов и точности хода.",
            "Сағаттар мен механизмдер өндірісінде бай тарихы бар, техникалық дәлдік пен ойластырылған дизайнды үйлестіруімен танымал жапон бренді. Оның бұйымдары стильді әрі практикалық шешімдер ұсынады. Rhythm материалдардың сапасы мен жүріс дәлдігіне ерекше көңіл бөледі.",
            "A Japanese brand with a rich history in producing clocks, watches, and movements, known for combining technical precision with considered design. Its products offer stylish and practical solutions. Rhythm pays particular attention to material quality and accurate timekeeping."
        ),
        history: localized(`История компании Rhythm начинается в 1950 году в Японии, когда она была основана как производитель часов и точных механизмов. С самых ранних лет бренд стал известен своими интерьерными и настенными часами, а в 1951 году выпустил одну из первых в стране моделей с пластиковым корпусом - важный шаг в развитии массового производства.

В 1953 году Rhythm заключила партнёрство с Citizen Watch Co., что позволило получить доступ к новым технологиям и расширить коммерческие возможности.

В последующие десятилетия компания активно росла: её продукция стала экспортироваться на зарубежные рынки, а в 1963 году Rhythm была зарегистрирована на Токийской фондовой бирже.

Rhythm также внедрила философию контроля качества «Zero Defect» и выпустила одни из первых японских кварцевых часов, укрепив репутацию производителя надёжных и инновационных изделий.`,
            `Rhythm компаниясының тарихы 1950 жылы Жапонияда сағаттар мен дәл механизмдер өндірушісі ретінде құрылған кезден басталады. Алғашқы жылдардан-ақ бренд интерьерлік және қабырға сағаттарымен танылды, ал 1951 жылы елдегі пластик корпусы бар алғашқы модельдердің бірін шығарды - бұл жаппай өндірісті дамытудағы маңызды қадам болды.

1953 жылы Rhythm Citizen Watch Co. компаниясымен серіктестік орнатып, жаңа технологияларға қол жеткізді және коммерциялық мүмкіндіктерін кеңейтті.

Кейінгі онжылдықтарда компания белсенді өсті: оның өнімдері шетел нарықтарына экспорттала бастады, ал 1963 жылы Rhythm Токио қор биржасында тіркелді.

Rhythm сондай-ақ «Zero Defect» сапаны бақылау философиясын енгізіп, алғашқы жапон кварц сағаттарының бірін шығарды. Осылайша сенімді әрі инновациялық өнім өндірушісі ретіндегі беделін нығайтты.`,
            `Rhythm's history began in Japan in 1950, when the company was founded as a manufacturer of clocks, watches, and precision movements. From its earliest years, the brand became known for interior and wall clocks, and in 1951 it released one of the country's first models with a plastic case—an important step in the development of mass production.

In 1953, Rhythm entered into a partnership with Citizen Watch Co., gaining access to new technologies and expanding its commercial opportunities.

The company grew actively over the following decades: its products began to be exported to overseas markets, and in 1963 Rhythm was listed on the Tokyo Stock Exchange.

Rhythm also introduced the “Zero Defect” quality-control philosophy and released some of the first Japanese quartz clocks, strengthening its reputation as a manufacturer of reliable and innovative products.`),
        brandBannerSrc: "/Rhythm_brand_banner.webp",
        catalogBannerFallbackSrc: "/Rhythm_brand_banner.webp",
    },
    "royal-london": {
        description: localized(
            "Английский часовой бренд, в основе которого сочетание традиционного британского стиля и современной практичности. Часы Royal London создаются с вниманием к деталям, вдохновляясь эстетикой Лондона, что делает их стильным аксессуаром для любого образа.",
            "Дәстүрлі британ стилі мен заманауи практикалықты үйлестіретін ағылшын сағат бренді. Royal London сағаттары Лондон эстетикасынан шабыт алып, әр бөлшекке мұқият назар аударыла отырып жасалады, сондықтан олар кез келген образға стильді аксессуар бола алады.",
            "An English watch brand built on a combination of traditional British style and modern practicality. Royal London watches are created with attention to detail and inspired by London's aesthetic, making them a stylish accessory for any look."
        ),
        history: localized(`История Royal London началась в 1997–1998 годах, когда британская компания Condor Group Ltd., специализировавшаяся на производстве ремешков и аксессуаров, решила создать собственный часовой бренд и представить на рынок собственные модели. Первые часы под маркой Royal London были представлены в 1998 году, а их логотип с короной символизировал высокий стиль и классическую эстетику.

С тех пор бренд развивался, сочетая традиционный британский дизайн с качественными компонентами и расширяя своё международное присутствие через партнёрства с розничными сетями по всему миру.

В 2018 году Royal London представил коллекцию Made in London, в которой высококачественные детали из разных стран собираются непосредственно в Лондоне, укрепляя концепцию британского дизайна и технической продуманности.`,
            `Royal London тарихы 1997–1998 жылдары басталды. Сол кезде баулар мен аксессуарлар өндіруге маманданған британдық Condor Group Ltd. компаниясы өз сағат брендін құрып, жеке модельдерін нарыққа шығаруға шешім қабылдады. Royal London маркасымен алғашқы сағаттар 1998 жылы таныстырылды, ал тәж бейнеленген логотип жоғары стиль мен классикалық эстетиканы білдірді.

Содан бері бренд дәстүрлі британ дизайнын сапалы компоненттермен үйлестіріп, әлем бойынша бөлшек сауда желілерімен серіктестік арқылы халықаралық қатысуын кеңейтіп дамыды.

2018 жылы Royal London Made in London топтамасын таныстырды. Онда әртүрлі елдерден жеткізілген жоғары сапалы бөлшектер тікелей Лондонда құрастырылып, британ дизайны мен техникалық ойластырылу тұжырымдамасын нығайтты.`,
            `Royal London's history began in 1997–1998, when the British company Condor Group Ltd., which specialized in producing straps and accessories, decided to create its own watch brand and bring its own models to market. The first watches under the Royal London name were introduced in 1998, and the crown in their logo symbolized elevated style and classic aesthetics.

Since then, the brand has developed by combining traditional British design with quality components and expanding its international presence through partnerships with retail chains around the world.

In 2018, Royal London introduced the Made in London collection, in which high-quality components from different countries are assembled directly in London, reinforcing the concept of British design and considered engineering.`),
        brandBannerSrc: "/Royal_london_brand_banner.webp",
        catalogBannerFallbackSrc: "/Royal_london_brand_banner.webp",
    },
};

export function getBrandPageData(slug: string, locale: LocaleEnum): BrandPageData | null {
    const brand = findPublicBrandBySlug(slug);

    if (!brand) {
        return null;
    }

    const content = BRAND_PAGE_CONTENT[brand.slug];
    const history = content.history[locale] ?? content.history[LocaleEnum.RU];
    const catalogBannerSrc = content.catalogBannerSrc ?? content.catalogBannerFallbackSrc ?? content.brandBannerSrc;

    return {
        ...brand,
        description: content.description[locale] ?? content.description[LocaleEnum.RU],
        historyParagraphs: history.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean),
        brandBannerSrc: content.brandBannerSrc,
        catalogBannerSrc,
        hasCatalogBannerFallback: !content.catalogBannerSrc && Boolean(catalogBannerSrc),
    };
}
