const fs = require('fs');
const path = 'app/(dashboard)/instructor/groups/InstructorGroupClient.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '<div ref={chatContainerRef}';
const endMarker = '<div className="relative mt-auto';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    
    const newDiv = `<div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto mb-4 custom-scrollbar pr-3">
                               {isChatLoading ? (
                                  <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-50">
                                     <Loader2 className="w-6 h-6 animate-spin text-[#FF8A75]" />
                                     <p className="text-[10px] font-bold uppercase tracking-widest">Loading Conversation...</p>
                                  </div>
                               ) : messages.length === 0 ? (
                                  <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-30">
                                     <MessageSquare className="w-8 h-8 text-slate-300" />
                                     <p className="text-[10px] font-bold uppercase tracking-widest">No messages yet</p>
                                  </div>
                               ) : (
                                  messages.map((msg: any) => {
                                     const isMe = msg.sender_id === currentUser.id;
                                     const sender = msg.sender || {};
                                     const roles = { 
                                        admin: 'Admin', 
                                        instructor: 'Instructor', 
                                        staff: 'Staff', 
                                        client_management: 'Staff' 
                                     };
                                     const roleLabel = roles[sender.role] || (msg.sender_id === selectedBatch?.instructor_id ? 'Instructor' : null);

                                     return (
                                        <div key={msg.id} className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                                           {!isMe && (
                                              <div className="flex flex-col ml-2">
                                                 <span className="text-[10px] font-bold text-slate-800 leading-none mb-1">{sender?.full_name || 'User'}</span>
                                                 {roleLabel && <span className="text-[8px] font-bold uppercase tracking-widest text-[#FF8A75] leading-none">{roleLabel}</span>}
                                              </div>
                                           )}
                                           <div className={cn(
                                              "px-4 py-2.5 rounded-2xl text-[13px] font-medium max-w-[85%] leading-relaxed shadow-sm",
                                              isMe ? "bg-[#FF8A75] text-white rounded-tr-none shadow-[#FF8A75]/10" : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none"
                                           )}>
                                              {msg.content}
                                           </div>
                                        </div>
                                     );
                                  })
                               )}
                            </div>

                            `;
    
    fs.writeFileSync(path, before + newDiv + after);
    console.log('Successfully updated chat UI');
} else {
    console.error('Markers not found');
    process.exit(1);
}
