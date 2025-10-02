import { useState, useEffect } from "react";
import { Search, Loader2, Package, Mail, Phone, User, ArrowLeft, Plus, X, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const categories = [
  { value: "all", label: "All Items" },
  { value: "books", label: "Books" },
  { value: "electronics", label: "Electronics" },
  { value: "furniture", label: "Furniture" },
  { value: "clothing", label: "Clothing" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" }
];

const categoryStyles = {
  books: "bg-slate-100 text-slate-800 border-slate-300",
  electronics: "bg-zinc-100 text-zinc-800 border-zinc-300",
  furniture: "bg-neutral-100 text-neutral-800 border-neutral-300",
  clothing: "bg-stone-100 text-stone-800 border-stone-300",
  sports: "bg-gray-100 text-gray-800 border-gray-300",
  other: "bg-slate-100 text-slate-800 border-slate-300"
};

const conditions = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" }
];

const MarketplaceApp = () => {
  const [view, setView] = useState("marketplace");
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="min-h-screen">
      {view === "marketplace" && (
        <Marketplace 
          onViewProduct={(p) => { setSelectedProduct(p); setView("detail"); }} 
          onSellClick={() => setView("sell")}
          onMyListingsClick={() => setView("mylistings")}
        />
      )}
      {view === "detail" && (
        <ProductDetail 
          product={selectedProduct} 
          onBack={() => { setView("marketplace"); setSelectedProduct(null); }} 
        />
      )}
      {view === "sell" && (
        <SellItem onBack={() => setView("marketplace")} />
      )}
      {view === "mylistings" && (
        <MyListings 
          onBack={() => setView("marketplace")}
          onViewProduct={(p) => { setSelectedProduct(p); setView("detail"); }}
        />
      )}
    </div>
  );
};

const Marketplace = ({ onViewProduct, onSellClick, onMyListingsClick }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("college_id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("marketplace_items")
        .select(`
          *,
          seller:user_profiles!seller_id(
            first_name,
            last_name,
            email,
            phone_number
          )
        `)
        .eq("college_id", profile.college_id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  };

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-bold mb-4 tracking-tight">
              Student Marketplace
            </h1>
            <p className="text-xl mb-10 leading-relaxed">
              Buy and sell used items with fellow students in your community
            </p>
            
            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-black" />
              <input
                type="text"
                placeholder="Search for textbooks, electronics, furniture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-2xl text-black"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={onSellClick}
                className=" px-8 py-4 rounded-xl font-semibold hover:bg-gray-400 transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                List an Item
              </button>
              
              <button
                onClick={onMyListingsClick}
                className="px-8 py-4 rounded-xl font-semibold hover:bg-gray-600 transition-all flex items-center gap-2 shadow-lg"
              >
                <Package className="h-5 w-5" />
                My Listings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Category Filter */}
        <div className="mb-10 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.value;
            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-6 py-3 rounded-sm font-medium transition-all whitespace-nowrap border-2 ${
                  isSelected
                    ? "border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 rounded-2xl shadow-sm border">
            <Package className="h-20 w-20 mx-auto mb-4" />
            <p className="text-2xl font-semibold mb-2">No items found</p>
            <p >Try adjusting your search or be the first to list something!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onClick={() => onViewProduct(product)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const ProductCard = ({ product, onClick }) => {
  const categoryStyle = categoryStyles[product.category] || categoryStyles.other;
  const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
  
  return (
    <div
      onClick={onClick}
      className="rounded-xl overflow-hidden border-2 border-gray-500 hover:border-gray-900 hover:shadow-xl transition-all duration-300 cursor-pointer group"
    >
      <div className="aspect-square overflow-hidden relative">
        {firstImage ? (
          <img 
            src={firstImage} 
            alt={product.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="h-20 w-20" />
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-lg line-clamp-2 mb-2 group-hover:text-gray-700 transition-colors">
          {product.title}
        </h3>
        <p className="text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            ${product.price}
          </div>
          <span className={`px-3 py-1.5 rounded-md text-xs font-semibold border-2 ${categoryStyle}`}>
            {product.category}
          </span>
        </div>
      </div>
    </div>
  );
};

const ProductDetail = ({ product, onBack }) => {
  const categoryStyle = categoryStyles[product.category] || categoryStyles.other;
  const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
  const sellerName = product.seller ? `${product.seller.first_name} ${product.seller.last_name}` : "Anonymous";
  const sellerEmail = product.seller?.email || "";
  const sellerPhone = product.seller?.phone_number;

  return (
    <div className="container mx-auto px-6 py-10">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 hover:text-gray-500 mb-8 font-medium transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Marketplace
      </button>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Image Section */}
        <div className="rounded-2xl overflow-hidden border-1 border-gray-500 shadow-lg">
          <div className="aspect-square">
            {firstImage ? (
              <img src={firstImage} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-32 w-32" />
              </div>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <div className="rounded-2xl p-8 border-2 border-gray-500 shadow-lg">
            <h1 className="text-4xl font-bold mb-5 leading-tight">
              {product.title}
            </h1>
            
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 ${categoryStyle}`}>
                {product.category}
              </span>
              <span className="px-4 py-2 rounded-lg text-sm font-semibold border-2 border-gray-500">
                {product.condition}
              </span>
            </div>

            <div className="text-5xl font-bold mb-6">
              ${product.price}
            </div>

            <p className="leading-relaxed text-lg">
              {product.description}
            </p>
          </div>

          {/* Seller Information */}
          <div className=" rounded-2xl p-8 border-2 border-gray-500 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Seller Information</h2>
            
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className=" rounded-full p-3">
                  <User className="h-6 w-6 " />
                </div>
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="font-semibold text-lg">{sellerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="rounded-full p-3">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="font-semibold text-lg break-all">{sellerEmail}</p>
                </div>
              </div>

              {sellerPhone && (
                <div className="flex items-center gap-4">
                  <div className="rounded-full p-3">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="font-semibold text-lg">{sellerPhone}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.href = `mailto:${sellerEmail}?subject=Interested in ${product.title}`}
              className="w-full mt-8  py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Mail className="h-5 w-5" />
              Contact Seller
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SellItem = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "good",
    images: []
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please sign in to upload images");
        setUploading(false);
        return;
      }

      const uploadedUrls = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('marketplace-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('marketplace-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setFormData({ ...formData, images: [...formData.images, ...uploadedUrls] });
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload images: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("Please sign in to sell items");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("college_id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        alert("Profile not found");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("marketplace_items").insert({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        condition: formData.condition,
        images: formData.images,
        seller_id: user.id,
        college_id: profile.college_id,
        status: "active"
      });

      if (error) throw error;
      
      alert("Item listed successfully!");
      onBack();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to list item: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-3xl">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 hover:text-gray-500 mb-8 font-medium"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Marketplace
      </button>

      <div className=" rounded-2xl p-10 border-2 border-gray-600 shadow-lg">
        <h1 className="text-4xl font-bold mb-3">List Your Item</h1>
        <p className=" text-lg mb-10">Fill in the details to sell your item to fellow students</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Item Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Calculus Textbook - 12th Edition"
              className="w-full px-5 py-4 rounded-xl border-2 bg-gray-800 border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the condition, features, and any other relevant details..."
              rows={5}
              className="w-full px-5 py-4 rounded-xl border-2 bg-gray-800 border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Price(₹) *</label>
              <input
                type="number"
                step="10"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="w-full px-5 py-4 rounded-xl border-2 bg-gray-800 border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-5 py-4 rounded-xl border-2 bg-gray-800 border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Select category...</option>
                {categories.filter(c => c.value !== "all").map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Condition *</label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full px-5 py-4 rounded-xl border-2 bg-gray-800 border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {conditions.map(cond => (
                <option key={cond.value} value={cond.value}>{cond.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Product Images</label>
            <p className="text-sm mb-3">Upload photos of your item</p>
            
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label 
                htmlFor="image-upload" 
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin" />
                    <p className="font-medium">Uploading images...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12" />
                    <p className="font-semibold">Click to upload images</p>
                    <p className="text-sm">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {formData.images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={url} 
                      alt={`Upload ${idx + 1}`} 
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="w-full bg-gray-900 text-white py-5 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-8"
          >
            {loading ? "Listing Item..." : "List Item"}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyListings = ({ onBack, onViewProduct }) => {
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("marketplace_items")
        .select(`
          *,
          seller:user_profiles!seller_id(
            first_name,
            last_name,
            email,
            phone_number
          )
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyItems(data || []);
    } catch (error) {
      console.error("Failed to load listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      const { error } = await supabase
        .from("marketplace_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      
      setMyItems(myItems.filter(item => item.id !== itemId));
      alert("Item deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete item: " + error.message);
    }
  };

  const handleMarkAsSold = async (itemId) => {
    if (!confirm("Mark this item as sold?")) return;

    try {
      const { error } = await supabase
        .from("marketplace_items")
        .update({ status: "sold" })
        .eq("id", itemId);

      if (error) throw error;
      
      fetchMyListings();
      alert("Item marked as sold!");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update item: " + error.message);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 hover:text-gray-500 mb-8 font-medium"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Marketplace
      </button>

      <div className=" rounded-2xl p-8 border-2 border-gray-600 shadow-lg mb-8">
        <h1 className="text-4xl font-bold mb-2">My Listings</h1>
        <p className="text-lg">Manage your marketplace items</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
        </div>
      ) : myItems.length === 0 ? (
        <div className="text-center py-20 rounded-2xl shadow-sm border border-gray-700">
          <Package className="h-20 w-20 mx-auto mb-4" />
          <p className="text-2xl font-semibold mb-2">No listings yet</p>
          <p className="mb-6">Start selling by listing your first item!</p>
          <button
            onClick={onBack}
            className=" px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            List an Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {myItems.map((item) => (
            <MyListingCard 
              key={item.id} 
              item={item} 
              onDelete={handleDelete}
              onMarkAsSold={handleMarkAsSold}
              onView={() => onViewProduct(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MyListingCard = ({ item, onDelete, onMarkAsSold, onView }) => {
  const categoryStyle = categoryStyles[item.category] || categoryStyles.other;
  const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
  const isSold = item.status === "sold";

  return (
    <div className={` rounded-xl overflow-hidden border-2 ${isSold ? 'border-gray-500 opacity-75' : 'border-gray-600'} shadow-lg hover:shadow-xl transition-all`}>
      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* Image */}
        <div 
          className="w-full md:w-48 h-48 flex-shrink-0 bg-gray-500 rounded-lg overflow-hidden cursor-pointer"
          onClick={onView}
        >
          {firstImage ? (
            <img 
              src={firstImage} 
              alt={item.title} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="h-16 w-16" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 
                className="font-bold text-2xl mb-2 cursor-pointer hover:text-gray-500 transition-colors"
                onClick={onView}
              >
                {item.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-3 py-1.5 rounded-md text-xs font-semibold border-2 ${categoryStyle}`}>
                  {item.category}
                </span>
                <span className="px-3 py-1.5 rounded-md text-xs font-semibold border-2 border-gray-300">
                  {item.condition}
                </span>
                {isSold && (
                  <span className="px-3 py-1.5 rounded-md text-xs font-semibold border-2 border-red-300">
                    SOLD
                  </span>
                )}
              </div>
            </div>
            <div className="text-3xl font-bold">
              ₹{item.price}
            </div>
          </div>

          <p className=" mb-4 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onView}
              className="px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              View Details
            </button>
            
            {!isSold && (
              <button
                onClick={() => onMarkAsSold(item.id)}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                Mark as Sold
              </button>
            )}
            
            <button
              onClick={() => onDelete(item.id)}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceApp;