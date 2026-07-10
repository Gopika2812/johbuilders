const fs = require('fs');

const file = 'client/src/pages/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">[\s\S]*?{?\/\* Card 4: Total Booked \*\/}?[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newCards = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Total Leads */}
              <div 
                onClick={handleLeadsCardClick}
                className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer select-none active:scale-[0.99] duration-150 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-black font-extrabold uppercase tracking-wider">Total Leads</span>
                    <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{stats.cards.totalLeads || 0}</h3>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Followup */}
              <div 
                className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-black font-extrabold uppercase tracking-wider">Total Followup</span>
                    <h3 className="text-3xl font-extrabold text-gray-800 mt-1">
                      { (stats.cards.enquiries?.contacted || 0) + (stats.cards.enquiries?.followup || 0) + (stats.cards.siteVisits?.total || 0) }
                    </h3>
                  </div>
                </div>
              </div>

              {/* Card 3: Total Booked */}
              <div 
                onClick={handleBookedCardClick}
                className="bg-[#f0fbf4] border-none rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer select-none active:scale-[0.99] duration-150 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-black font-extrabold uppercase tracking-wider">Total Booked</span>
                    <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{stats.cards.booked?.total || 0}</h3>
                  </div>
                </div>
              </div>

              {/* Card 4: Lost Leads */}
              <div 
                className="bg-[#fcf3f3] border-none rounded-3xl p-6 shadow-sm hover:shadow-md transition cursor-pointer select-none active:scale-[0.99] duration-150 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-rose-600 font-extrabold uppercase tracking-wider">Lost Leads</span>
                    <h3 className="text-3xl font-extrabold text-rose-600 mt-1">
                      {(stats.cards.enquiries?.closed || 0) + (stats.cards.siteVisits?.closed || 0) + (stats.stageStats?.['Lost']?.count || 0)}
                    </h3>
                  </div>
                </div>
              </div>

            </div>
          </div>`;

if (regex.test(content)) {
    content = content.replace(regex, newCards);
    fs.writeFileSync(file, content);
    console.log("Replaced cards successfully.");
} else {
    console.log("Could not find the target section.");
}
